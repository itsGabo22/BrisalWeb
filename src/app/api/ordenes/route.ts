import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { formatCOP } from '@/lib/utils/pricing';
import { getAvailableStock } from '@/lib/orders/backorder';
import {
  InsufficientStockError,
  lineLabel,
  reserveStock,
  resolveStockRow,
  type StockReservation,
} from '@/lib/orders/reservation';
import { computeCouponDiscount, findRedeemableCoupon, redeemCoupon } from '@/lib/coupons';
import { quoteCartLines } from '@/lib/pricing/quote';
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

/**
 * The 409 shape, in one place.
 *
 * 409 rather than 400: the request is well-formed — the world changed under it.
 * Every offending line is named, because "no hay stock" without saying of WHAT
 * leaves the shopper to guess which of six items to edit.
 *
 * Extracted because there are now two callers that must answer identically: the
 * courtesy pre-check, and the reservation that is the real authority. A shopper
 * must not be able to tell which one refused them.
 */
function insufficientStockResponse(unavailable: string[]): NextResponse {
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
 * Reads what a failed line actually has left, AFTER its transaction rolled back.
 *
 * Deliberately a fresh read outside the aborted transaction: the value seen
 * inside it is not what the next shopper will see, and quoting it would send the
 * customer back to a cart that fails again for a different number. Best-effort —
 * if this read also fails, the generic "agotado" wording still tells the truth.
 */
async function describeShortfall(reservation: StockReservation): Promise<string> {
  try {
    const row =
      reservation.table === 'ColorVariant'
        ? await prisma.colorVariant.findUnique({
            where: { id: reservation.rowId },
            select: { stock: true },
          })
        : await prisma.product.findUnique({
            where: { id: reservation.rowId },
            select: { stock: true },
          });

    if (!row) {
      return `${reservation.label}: ya no está disponible`;
    }
    if (row.stock <= 0) {
      return `${reservation.label}: agotado`;
    }
    // "unidad disponible" / "unidades disponibles" — the adjective has to agree
    // too. It read "solo 1 unidad disponibles" before.
    return `${reservation.label}: solo ${row.stock} ${
      row.stock === 1 ? 'unidad disponible' : 'unidades disponibles'
    } (pediste ${reservation.quantity})`;
  } catch {
    return `${reservation.label}: agotado`;
  }
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
     * ─── Fast path: a courtesy pre-check ───────────────────────────────────
     *
     * NOT what prevents overselling. This turns the overwhelmingly common case
     * — a cart that went stale while the shopper browsed — into one clear
     * message naming every offending line, without opening a transaction. It
     * READS stock, so it is inherently racy, and nothing it concludes is
     * trusted.
     *
     * The guarantee lives in the guarded decrements below. If this passes and
     * the reservation then fails, the reservation wins and the customer gets the
     * same 409 — which is exactly what used to be impossible, because this
     * check WAS the only gate between a shopper and an oversold item.
     */
    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(items.map((item) => item.productId))] } },
      include: { colorVariants: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    /**
     * Remaining per COLOUR ROW as the lines are walked, not per product: two
     * lines of one product in different colours draw on different rows, and two
     * lines hitting the SAME row must not each be granted the same starting
     * stock. `reserveStock` enforces the identical rule in the database, which
     * is what makes it hold across separate requests too.
     */
    const remaining = new Map<string, number>();
    const unavailable: string[] = [];
    const reservations: StockReservation[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      const label = lineLabel(item);

      // Deleted since the cart was filled. No row to reserve against, so it
      // cannot be ordered.
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
                available === 1 ? 'unidad disponible' : 'unidades disponibles'
              } (pediste ${item.quantity})`,
        );
        continue;
      }

      remaining.set(key, available - item.quantity);
      reservations.push(resolveStockRow(product, { ...item, ...colorRef }));
    }

    if (unavailable.length > 0) {
      return insufficientStockResponse(unavailable);
    }

    /**
     * ─── Prices come from the DATABASE, not from the request ───────────────
     *
     * This used to be `items.reduce((sum, i) => sum + i.price * i.quantity, 0)`
     * — the client's own per-line prices. Recomputing the SUM server-side was
     * never the same thing as deriving the PRICES server-side, and with
     * audience- and quantity-scoped discounts it stopped being defensible: a
     * logged-out shopper could post the wholesale-only price, or the 5-unit
     * price on a cart of one, and the order would be written and quoted at it.
     *
     * `quoteCartLines` re-derives every unit price from the product rows, the
     * discounts that actually reach them, the quantities in THIS cart, and the
     * wholesale status of the real session — never `wholesaleUserId`, which is
     * client-supplied and is only a label on the order. The posted `price` is
     * now ignored entirely.
     */
    const quote = await quoteCartLines(
      items.map((item) => ({
        productId: item.productId,
        colorVariantId: item.colorVariantId,
        color: item.color,
        quantity: item.quantity,
      })),
    );

    /** Line index → server price, so the writes below cannot pick up a posted one. */
    const pricedLines = quote.lines;
    const lineSubtotal = quote.subtotal;

    /**
     * ─── The transaction that actually decides ────────────────────────────
     *
     * Reserve → redeem coupon → write the order. All or nothing.
     *
     * That ORDER is preserved from before and load-bearing: stock is committed
     * to FIRST, so a shopper whose item sold out never loses a coupon
     * redemption to an order that was never going to succeed.
     *
     * Putting all three in ONE transaction is the change. When creation merely
     * READ stock, claiming the coupon and writing the order as separate steps
     * was survivable. Now that creation MOVES stock it is not: any failure
     * after a successful reservation would strand units as reserved against an
     * order that does not exist — stock the client can never sell and no screen
     * would ever explain. It also closes a pre-existing hole, where a coupon use
     * was burned outright if `order.create` threw.
     */
    let appliedCoupon: { code: string; discountAmount: number } | null = null;

    /**
     * The coupon LOOKUP is read-only and claims nothing, so it is deliberately
     * hoisted out of the transaction below. Everything inside that transaction
     * holds one of only five pooled connections (see `src/lib/prisma.ts`), and
     * under a burst of concurrent orders the scarce resource is connection-hold
     * TIME. Doing a read in there that could equally be done out here is how a
     * checkout queue turns into transaction-acquisition timeouts.
     *
     * The CLAIM still happens inside, after the reservation — that ordering is
     * the part that matters, and it is preserved.
     */
    const coupon = couponCode ? await findRedeemableCoupon(couponCode) : null;

    const order = await prisma.$transaction(
      async (tx) => {
        // Throws InsufficientStockError — rolling back every decrement already
        // applied — the moment a line's guarded UPDATE matches no row.
        await reserveStock(tx, reservations);

        /**
         * Redemption, not just validation. `redeemCoupon` claims a use in ONE
         * atomic statement re-checking active, dates and the usage limit — so
         * two orders racing for the last redemption cannot both win. A coupon
         * that expired or ran out since the shopper applied it simply does not
         * apply; the order still goes through at full price rather than failing,
         * because losing a cart over a stale code is the worse outcome.
         *
         * Handed `tx`, so the claim shares the fate of the reservation above.
         */
        if (coupon && (await redeemCoupon(coupon.code, new Date(), tx))) {
          appliedCoupon = {
            code: coupon.code,
            discountAmount: computeCouponDiscount(lineSubtotal, coupon.percentage),
          };
        }

        const orderTotal = Math.max(0, lineSubtotal - (appliedCoupon?.discountAmount ?? 0));

        return tx.order.create({
          data: {
            total: orderTotal,
            status: 'PENDING_WHATSAPP',
            customerName,
            customerPhone,
            wholesaleUserId: wholesaleUserId ?? null,
            couponCode: appliedCoupon?.code ?? null,
            couponDiscountAmount: appliedCoupon?.discountAmount ?? null,
            items: {
              create: items.map((item, index) => ({
                productId: item.productId,
                name: item.name,
                // The server's price for this line, never the posted one.
                price: pricedLines[index]?.unitPrice ?? 0,
                quantity: item.quantity,
                imageUrl: item.imageUrl ?? null,
                color: item.color ?? null,
                colorVariantId: item.colorVariantId ?? null,
                reference: item.reference ?? null,
                // Always 0 now. Kept explicit rather than left to the column
                // default so it is obvious at the write site that new orders
                // never carry a backorder, while the field survives for history.
                backorderQty: 0,
              })),
            },
          },
        });
      },
      {
        /**
         * Tuned against a real failure, not guessed. Firing fifteen simultaneous
         * orders at one low-stock colour produced eight HTTP 500s with
         * "Unable to start a transaction in the given time": Prisma waits only
         * 2000ms by DEFAULT to acquire a transaction, and the pool is capped at
         * five connections on purpose (see `src/lib/prisma.ts` — the Supabase
         * pooler ceiling divided across Vercel instances). Under a burst,
         * fifteen transactions queue behind five slots and the default gives up.
         *
         * Correctness was never at risk — the guarded decrements held the
         * invariant exactly, and no order overslept its stock. What failed was
         * AVAILABILITY: a customer whose turn came 2.1 seconds late was told the
         * order could not be created, when waiting a moment longer would have
         * served them.
         *
         * `maxWait` matches the pool's own 10s `connectionTimeoutMillis`, so the
         * two give up on the same horizon rather than one masking the other.
         * `timeout` bounds the body itself — a few statements that should take
         * milliseconds — generously enough that a slow link never aborts a
         * half-applied reservation.
         */
        maxWait: 10_000,
        timeout: 15_000,
      },
    );

    // Read back off the created row rather than recomputing, so the WhatsApp
    // message and the stored order can never quote different totals.
    const total = order.total.toNumber();

    if (wholesaleUserId) {
      await prisma.user
        .update({ where: { id: wholesaleUserId }, data: { lastOrderAt: new Date() } })
        .catch(() => {});
    }

    /**
     * The message quotes the SERVER's line prices too. Passing `items` straight
     * through would print the client's figures next to a total derived from the
     * server's — and this message is what the client packs and charges from, so
     * lines that don't add up to the total read as a pricing error.
     */
    const message = buildWhatsAppMessage(
      order.id,
      items.map((item, index) => ({
        name: item.name,
        price: pricedLines[index]?.unitPrice ?? 0,
        quantity: item.quantity,
        color: item.color,
        reference: item.reference,
      })),
      total,
      customerName,
      customerPhone,
      appliedCoupon,
    );
    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ orderId: order.id, whatsappUrl }, { status: 201 });
  } catch (err) {
    /**
     * The race, arriving. Another order took the units between the pre-check
     * and the guarded decrement — the whole transaction rolled back, so neither
     * an order nor a reservation exists, and the customer gets the same 409 the
     * pre-check would have produced. The shortfall is re-read fresh so the
     * number quoted is the one they will actually see on the product page.
     */
    if (err instanceof InsufficientStockError) {
      return insufficientStockResponse([await describeShortfall(err.reservation)]);
    }

    /**
     * P2028 — the transaction could not be started or was aborted by Prisma,
     * essentially always because every pooled connection was busy for longer
     * than `maxWait`. Nothing was written: no order, no reservation, no coupon
     * claim, so retrying is both safe and likely to work.
     *
     * 503 with `Retry-After` rather than the generic 500 below, because those
     * two mean genuinely different things to whoever reads the log or the
     * screen: this is "we are busy, come back", not "your order broke". The
     * message says so in the same voice as the rest of the checkout errors.
     */
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2028') {
      console.warn('[ordenes] Transacción no disponible (pool saturado):', err.message);
      return NextResponse.json(
        {
          error:
            'Estamos recibiendo muchos pedidos en este momento. Espera unos segundos e inténtalo de nuevo.',
        },
        { status: 503, headers: { 'Retry-After': '5' } },
      );
    }

    console.error('[ordenes] Error al crear la orden:', err);
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 });
  }
}
