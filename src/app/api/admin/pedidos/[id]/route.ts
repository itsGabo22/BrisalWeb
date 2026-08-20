import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { releaseStock, resolveStockRow, type StockReservation } from '@/lib/orders/reservation';
import { releaseCouponRedemption } from '@/lib/coupons';
import { orderActionSchema } from '@/lib/validators';

/**
 * Flips an order out of PENDING, atomically, and reports whether THIS caller is
 * the one who did it.
 *
 * The check-then-write it replaces (`findUnique`, compare `status`, then
 * `update`) is the same shape of race the stock check had: two concurrent
 * rejections both read PENDING, both proceed, and the reserved stock is released
 * TWICE — inventing units out of nothing. Carrying the expected status in the
 * WHERE clause makes the transition itself the lock: Postgres matches the row
 * for exactly one of them, and `count` tells the loser it lost.
 *
 * This is what makes the release "exactly once" without needing a flag column
 * to track it. Whoever does not win the flip never reaches the release.
 */
async function claimPendingOrder(
  tx: Pick<Prisma.TransactionClient, '$executeRaw'>,
  id: string,
  nextStatus: 'CONFIRMED' | 'REJECTED',
): Promise<boolean> {
  const count = await tx.$executeRaw(Prisma.sql`
    UPDATE "Order"
       SET "status" = ${nextStatus}::"OrderStatus",
           "updatedAt" = NOW()
     WHERE "id" = ${id}
       AND "status" = 'PENDING_WHATSAPP'::"OrderStatus"
  `);
  return count === 1;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
    }

    const parsed = orderActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }
    const { action } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // A cheap, friendly early exit for the ordinary "you already clicked this"
    // case. It is NOT the guard — `claimPendingOrder` is, inside the
    // transaction — because by the time this comparison runs the value can
    // already be stale.
    if (order.status !== 'PENDING_WHATSAPP') {
      return NextResponse.json(
        { error: 'Este pedido ya fue procesado' },
        { status: 409 },
      );
    }

    /**
     * ─── CONFIRM ──────────────────────────────────────────────────────────
     *
     * Status transition ONLY. It used to deduct stock here, and must not any
     * more: the units were already taken out of inventory when the order was
     * created (see `reserveStock`), so deducting again would remove them twice
     * and drive real stock down by double every sale.
     *
     * The `backorderQty` raising that lived here went with it. It existed to
     * record a shortfall discovered at confirm time, and there can no longer be
     * one — an order that could not be covered was never created. Removing the
     * write leaves historical values exactly as they are; nothing rewrites them.
     */
    if (action === 'confirm') {
      const claimed = await prisma.$transaction((tx) => claimPendingOrder(tx, id, 'CONFIRMED'));

      if (!claimed) {
        return NextResponse.json(
          { error: 'Este pedido ya fue procesado' },
          { status: 409 },
        );
      }

      const confirmed = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });
      return NextResponse.json(confirmed);
    }

    /**
     * ─── REJECT ───────────────────────────────────────────────────────────
     *
     * The moment reserved units go back on the shelf. Rejecting used to touch
     * stock not at all, which was correct when nothing had been reserved; now it
     * is the ONLY thing that undoes a reservation, and skipping it would quietly
     * retire inventory the client still physically owns.
     *
     * Release and status flip share one transaction, and the flip is claimed
     * FIRST: if it fails, this caller lost the race and returns without
     * touching stock, so a double-click cannot release the same units twice.
     * If the release then throws, the flip rolls back with it and the order
     * stays pending — recoverable by clicking again, which is much better than
     * a rejected order whose stock was never returned.
     */
    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(order.items.map((item) => item.productId))] } },
      include: { colorVariants: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const toRelease: StockReservation[] = [];
    for (const item of order.items) {
      const product = productMap.get(item.productId);
      // Product deleted since the order was placed — there is no row left to
      // return the units to, and the rejection still has to succeed.
      if (!product) continue;
      toRelease.push(resolveStockRow(product, item));
    }

    const claimed = await prisma.$transaction(async (tx) => {
      if (!(await claimPendingOrder(tx, id, 'REJECTED'))) return false;
      await releaseStock(tx, toRelease);
      return true;
    });

    if (!claimed) {
      return NextResponse.json(
        { error: 'Este pedido ya fue procesado' },
        { status: 409 },
      );
    }

    const rejected = await prisma.order.findUnique({ where: { id } });
    return NextResponse.json(rejected);
  } catch (err) {
    console.error('[admin/pedidos/[id]] Error al procesar pedido:', err);
    return NextResponse.json({ error: 'Error al procesar el pedido' }, { status: 500 });
  }
}

/**
 * Deletes an order -- scoped to REJECTED only.
 *
 * Mirrors the rejected-wholesaler delete: rejected records are the only ones
 * whose story is over, so they are the only ones safe to throw away. A PENDING
 * order is still awaiting a decision and a CONFIRMED one is an accounting
 * record with stock already deducted against it -- deleting either would lose
 * real history, and the client ties this admin to their books. Rejected orders,
 * by contrast, accumulate forever with nothing to do about them, which is the
 * problem this solves.
 *
 * STOCK: deliberately untouched, and safe by construction rather than by luck.
 * Reaching this handler at all requires `status === 'REJECTED'`, and the only
 * way an order becomes REJECTED is the reject branch above, which already
 * returned its reserved units. Releasing again here would invent stock the
 * client does not have. There is nothing to release and nothing to guard: this
 * handler removes rows and never writes a stock column.
 *
 * `OrderItem` rows go with it: the relation is `onDelete: Cascade`, so the
 * lines are removed by the database rather than by a second query here.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar pedidos rechazados' },
        { status: 400 },
      );
    }

    /**
     * The coupon use has to be handed back BEFORE the row that records it is
     * gone -- `order.couponCode` is the only trace that this order ever claimed
     * one. `redeemCoupon` runs at order CREATION (see `POST /api/ordenes`), so
     * a rejected order has already consumed a redemption; without this, deleting
     * it would silently retire that use forever.
     *
     * Ordered deliberately: if the release succeeds and the delete then fails,
     * the coupon has one use too many available, which merely lets one extra
     * customer redeem it. The reverse order would lose a use with no record
     * left to recover it from. Over-crediting is the recoverable mistake.
     */
    if (order.couponCode) {
      await releaseCouponRedemption(order.couponCode);
    }

    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/pedidos/[id]] Error al eliminar pedido rechazado:', err);
    return NextResponse.json({ error: 'Error al eliminar el pedido' }, { status: 500 });
  }
}
