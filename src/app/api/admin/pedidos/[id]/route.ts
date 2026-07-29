import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

class InsufficientStockError extends Error {}

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

    // action === 'confirm'
    await prisma.$transaction(async (tx) => {
      const productIds = order.items.map((item) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((product) => [product.id, product]));

      const insufficient = order.items
        .filter((item) => {
          const product = productMap.get(item.productId);
          return !product || product.stock < item.quantity;
        })
        .map((item) => {
          const product = productMap.get(item.productId);
          return `${item.name} (disponible: ${product?.stock ?? 0}, solicitado: ${item.quantity})`;
        });

      if (insufficient.length > 0) {
        throw new InsufficientStockError(
          `Stock insuficiente para: ${insufficient.join(', ')}`,
        );
      }

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.order.update({ where: { id }, data: { status: 'CONFIRMED' } });
    });

    const confirmed = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    return NextResponse.json(confirmed);
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('[admin/pedidos/[id]] Error al procesar pedido:', err);
    return NextResponse.json({ error: 'Error al procesar el pedido' }, { status: 500 });
  }
}
