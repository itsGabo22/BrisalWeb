import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { formatCOP } from '@/lib/utils/pricing';
import { getAvailableStock } from '@/lib/orders/backorder';
import { computeCouponDiscount, findRedeemableCoupon, redeemCoupon } from '@/lib/coupons';
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';

interface MessageItem {
  name: string;
  price: number;
  quantity: number;
  color?: string | null;
  reference?: string | null;
}

function buildWhatsAppMessage(
  orderId: string,
  items: MessageItem[],
  total: number,
  customerName: string,
  customerPhone: string,
  coupon: { code: string; discountAmount: number } | null,
): string {
  const orderCode = orderId.slice(-6).toUpperCase();

  /**
   * Two lines of the same product in different colours have to be tellable
   * apart at a glance — this message is what the client packs from. Colour is
   * only printed when there is one, so a simple product doesn't get an empty
   * "Color:" label.
   *
   * The "SOBRE PEDIDO" line that used to appear here is gone with the backorder
   * path: every line in a NEW order is fully covered by stock, because the
   * route below refuses the order outright otherwise. Historical orders keep
   * their recorded `backorderQty` and still show it in the admin.
   */
  const itemLines = items
    .map((item) => {
      const color = item.color ? ` — Color: ${item.color}` : '';
      const reference = item.reference ? ` (Ref: ${item.reference})` : '';
      const amount = formatCOP(item.price * item.quantity);
      return `• ${item.name}${color}${reference}\n  x${item.quantity} = ${amount}`;
    })
    .join('\n');

  /**
   * The coupon gets its own line above the total: the client packs and quotes
   * from this message, so a total that is silently lower than the line items
   * add up to would look like a pricing error.
   */
  const couponLine = coupon
    ? `Cupón ${coupon.code}: −${formatCOP(coupon.discountAmount)}\n`
    : '';

  return (
    `¡Hola Brisal! Quiero hacer el siguiente pedido:\n\n` +
    `Pedido #${orderCode}\n` +
    `${itemLines}\n` +
    `─────────────────\n` +
    `${couponLine}` +
    `TOTAL: ${formatCOP(total)}\n\n` +
    `Nombre: ${customerName}\n` +
    `Teléfono: ${customerPhone}`
  );
}

export async function POST(request: Request) {
  /**
   * Order creation writes rows and sends the client to WhatsApp, so an
   * unthrottled loop here fills the pedidos list with junk the client has to
   * hand-reject. Ten an hour per connection is beyond any real shopper.
   */
  const ip = getClientIp(request);
  if (ip) {
    const limit = await checkRateLimit(RATE_LIMITS.orderCreate, `ip:${ip}`, ip);
    if (!limit.allowed) return rateLimitResponse(limit);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { items, customerName, customerPhone, wholesaleUserId, couponCode } = parsed.data;

  try {
    /**
     * Stock is read HERE rather than trusted from the client: the cart may have
     * been sitting in localStorage for days, and the shopper can't be the one
     * who decides how much of a colour exists.
     *
     * This used to RECORD the shortfall as `backorderQty` and accept the order
     * anyway — sobrepedido. That path is closed: ordering beyond stock risked
     * burying the client in production they never agreed to, so a line asking
     * for more than its colour holds now fails the whole order with a 409 the
     * cart can show. The storefront blocks it first (disabled buttons, a
     * quantity capped at stock), but the page's numbers are only as fresh as
     * its last load, so this is the check that actually decides.
     *
     * `backorderQty` stays in the schema and is written as 0 on every new line.
     * The column is order HISTORY — two existing orders carry real, non-zero
     * values the client still needs to see — so it is stopped from growing, not
     * removed.
     */
    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(items.map((item) => item.productId))] } },
      include: { colorVariants: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    /**
     * Stock remaining per COLOUR ROW as the lines are walked, not per product:
     * two lines of one product in different colours draw on different rows, and
     * two lines somehow hitting the SAME row must not each be granted the same
     * starting stock and together oversell it. This mirrors how the admin
     * confirm route accounts for its deductions.
     */
    const remaining = new Map<string, number>();
    const unavailable: string[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      const label = item.color ? `${item.name} (${item.color})` : item.name;

      // Deleted since the cart was filled. There is no stock to check and no
      // row to deduct from later, so it cannot be ordered.
      if (!product) {
        unavailable.push(`${label}: ya no está disponible`);
        continue;
      }

      const colorRef = { colorVariantId: item.colorVariantId, color: item.color };
      const key = item.colorVariantId ?? `product:${product.id}`;
      if (!remaining.has(key)) {
        remaining.set(key, getAvailableStock(product, colorRef));
      }

      const available = remaining.get(key)!;
      if (item.quantity > available) {
        unavailable.push(
          available <= 0
            ? `${label}: agotado`
            : `${label}: solo ${available} ${
                available === 1 ? 'unidad' : 'unidades'
              } disponibles (pediste ${item.quantity})`,
        );
        continue;
      }

      remaining.set(key, available - item.quantity);
    }

    /**
     * 409, not 400: the request is well-formed — the world changed under it.
     * Every offending line is named, because "no hay stock" without saying of
     * WHAT leaves the shopper to guess which of six items to edit. Returned
     * BEFORE the coupon is redeemed, so a rejected order never burns a use.
     */
    if (unavailable.length > 0) {
      return NextResponse.json(
        {
          error: `No pudimos completar tu pedido porque el stock cambió: ${unavailable.join(
            ' · ',
          )}. Ajusta las cantidades en tu carrito e inténtalo de nuevo.`,
          unavailable,
        },
        { status: 409 },
      );
    }

    /**
     * The line subtotal is recomputed from the posted prices rather than using
     * the client's `total`, so the coupon is applied to a figure the server
     * derived. The lines themselves already carry product-level discounts —
     * the coupon composes on top of that, sequentially.
     */
    const lineSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    /**
     * Redemption, not just validation. `redeemCoupon` re-checks active, dates
     * and the usage limit and claims a use in ONE atomic statement — so two
     * orders racing for the last redemption cannot both win. A coupon that
     * expired or ran out since the shopper applied it simply does not apply;
     * the order still goes through at full price rather than failing, because
     * losing a cart over a stale code is the worse outcome.
     */
    let appliedCoupon: { code: string; discountAmount: number } | null = null;
    if (couponCode) {
      const coupon = await findRedeemableCoupon(couponCode);
      if (coupon && (await redeemCoupon(coupon.code))) {
        appliedCoupon = {
          code: coupon.code,
          discountAmount: computeCouponDiscount(lineSubtotal, coupon.percentage),
        };
      }
    }

    const total = Math.max(0, lineSubtotal - (appliedCoupon?.discountAmount ?? 0));

    const order = await prisma.order.create({
      data: {
        total,
        status: 'PENDING_WHATSAPP',
        customerName,
        customerPhone,
        wholesaleUserId: wholesaleUserId ?? null,
        couponCode: appliedCoupon?.code ?? null,
        couponDiscountAmount: appliedCoupon?.discountAmount ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl ?? null,
            color: item.color ?? null,
            colorVariantId: item.colorVariantId ?? null,
            reference: item.reference ?? null,
            // Always 0 now. Kept explicit rather than left to the column
            // default so it is obvious at the write site that new orders never
            // carry a backorder, while the field itself survives for history.
            backorderQty: 0,
          })),
        },
      },
    });

    if (wholesaleUserId) {
      await prisma.user
        .update({ where: { id: wholesaleUserId }, data: { lastOrderAt: new Date() } })
        .catch(() => {});
    }

    const message = buildWhatsAppMessage(
      order.id,
      items,
      total,
      customerName,
      customerPhone,
      appliedCoupon,
    );
    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ orderId: order.id, whatsappUrl }, { status: 201 });
  } catch (err) {
    console.error('[ordenes] Error al crear la orden:', err);
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 });
  }
}
