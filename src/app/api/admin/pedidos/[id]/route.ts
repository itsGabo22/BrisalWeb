import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeBackorderQty, resolveLineVariant } from '@/lib/orders/backorder';
import { releaseCouponRedemption } from '@/lib/coupons';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action !== 'confirm' && action !== 'reject') {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.status !== 'PENDING_WHATSAPP') {
      return NextResponse.json(
        { error: 'Este pedido ya fue procesado' },
        { status: 409 },
      );
    }

    if (action === 'reject') {
      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'REJECTED' },
      });
      return NextResponse.json(updated);
    }

    /**
     * Confirm.
     *
     * Deducts what exists for each line's own COLOUR — stock lives per colour,
     * and an earlier version read the product's stock even for a line ordered
     * in a variant, decrementing the wrong row.
     *
     * The floor-at-zero behaviour is left exactly as it was, deliberately. It
     * is now a SAFETY NET rather than a feature: `POST /api/ordenes` refuses an
     * order it cannot cover, so a genuine oversell can no longer be created and
     * this path should always find enough stock. Should it somehow not — a
     * concurrent stock edit between order and confirm — nothing goes negative
     * and the shortfall is recorded on `backorderQty`, which is strictly better
     * than failing the confirmation or corrupting the stock column.
     */
    await prisma.$transaction(async (tx) => {
      const productIds = [...new Set(order.items.map((item) => item.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { colorVariants: true },
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      /**
       * Stock remaining per row as we walk the lines, keyed by row rather than
       * by product: two lines in different colours touch different rows, and
       * two lines that somehow touch the SAME row must not each be granted the
       * same starting stock and together drive it below zero.
       */
      const remaining = new Map<string, number>();
      const deductions = new Map<string, { variantId: string | null; productId: string; qty: number }>();

      for (const item of order.items) {
        const product = productMap.get(item.productId);
        // Product deleted since the order was placed — there is no row left to
        // deduct from, and the order still confirms.
        if (!product) continue;

        const variant = resolveLineVariant(product, item);
        const key = variant ? `v:${variant.id}` : `p:${product.id}`;

        if (!remaining.has(key)) {
          remaining.set(key, Math.max(0, variant ? variant.stock : product.stock));
        }

        const available = remaining.get(key)!;
        const deduct = Math.min(item.quantity, available);
        remaining.set(key, available - deduct);

        /**
         * What the line still owes AT CONFIRM TIME. It can only be worse than
         * what was recorded when the order was placed — another order may have
         * taken the stock in between — so the larger of the two wins. Raising
         * it never erases a recorded backorder, and it keeps the number the
         * client acts on equal to the units they actually have to make.
         */
        const owed = computeBackorderQty(item.quantity, available);
        if (owed > item.backorderQty) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { backorderQty: owed },
          });
        }

        if (deduct <= 0) continue;
        const existing = deductions.get(key);
        deductions.set(key, {
          variantId: variant?.id ?? null,
          productId: product.id,
          qty: (existing?.qty ?? 0) + deduct,
        });
      }

      for (const { variantId, productId, qty } of deductions.values()) {
        // `decrement` rather than an absolute set, so a concurrent stock edit
        // in the admin isn't silently overwritten by the value read above.
        if (variantId) {
          await tx.colorVariant.update({
            where: { id: variantId },
            data: { stock: { decrement: qty } },
          });
        } else {
          await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: qty } },
          });
        }
      }

      await tx.order.update({ where: { id }, data: { status: 'CONFIRMED' } });
    });

    const confirmed = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    return NextResponse.json(confirmed);
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
