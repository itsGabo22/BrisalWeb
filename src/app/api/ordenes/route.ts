import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { formatCOP } from '@/lib/utils/pricing';
import { computeBackorderQty, getAvailableStock } from '@/lib/orders/backorder';
import { computeCouponDiscount, findRedeemableCoupon, redeemCoupon } from '@/lib/coupons';

interface MessageItem {
  name: string;
  price: number;
  quantity: number;
  color?: string | null;
  reference?: string | null;
  /** 0 when the line was fully in stock. */
  backorderQty: number;
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
   * A backordered line gets one extra line naming the MISSING quantity, not the
   * ordered one: that number is what the client has to produce or restock. A
   * fully in-stock line is left exactly as it was.
   */
  const itemLines = items
    .map((item) => {
      const color = item.color ? ` — Color: ${item.color}` : '';
      const reference = item.reference ? ` (Ref: ${item.reference})` : '';
      const amount = formatCOP(item.price * item.quantity);
      const backorder =
        item.backorderQty > 0
          ? `\n  ⚠️ SOBRE PEDIDO: faltan ${item.backorderQty} ${
              item.backorderQty === 1 ? 'unidad' : 'unidades'
            } por reponer`
          : '';
      return `• ${item.name}${color}${reference}\n  x${item.quantity} = ${amount}${backorder}`;
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
     * Insufficient stock deliberately does NOT reject the order — that is the
     * whole point of sobrepedido. It is recorded per line instead.
     */
    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(items.map((item) => item.productId))] } },
      include: { colorVariants: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const linesWithBackorder = items.map((item) => {
      const product = productMap.get(item.productId);
      // A product that no longer exists can't be checked against stock; the
      // line is recorded as ordered rather than silently flagged.
      const available = product
        ? getAvailableStock(product, {
            colorVariantId: item.colorVariantId,
            color: item.color,
          })
        : item.quantity;

      return {
        ...item,
        backorderQty: computeBackorderQty(item.quantity, available),
      };
    });

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
          create: linesWithBackorder.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl ?? null,
            color: item.color ?? null,
            colorVariantId: item.colorVariantId ?? null,
            reference: item.reference ?? null,
            backorderQty: item.backorderQty,
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
      linesWithBackorder,
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
