import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeBackorderQty, resolveLineVariant } from '@/lib/orders/backorder';

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
     * This used to reject the whole order with a 409 the moment any line asked
     * for more than `Product.stock` held. Sobrepedido makes that wrong twice
     * over: an order deliberately placed beyond stock is now a normal order,
     * and stock is per COLOUR — the old check read the product's stock even for
     * a line ordered in a variant colour, so it both blocked orders it
     * shouldn't and decremented the wrong row.
     *
     * What it does now: deduct what actually exists for each line's own colour,
     * floored at zero, and never fail on insufficient stock. Nothing goes
     * negative; what could not be deducted stays owed on the line's
     * `backorderQty`, which is the record of what still has to be produced.
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
