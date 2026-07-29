import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Order, OrderItem } from '@prisma/client';

function serializeOrder(order: Order & { items: OrderItem[] }) {
  return {
    id: order.id,
    total: order.total.toNumber(),
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    wholesaleUserId: order.wholesaleUserId,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price.toNumber(),
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    })),
  };
}

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders.map(serializeOrder));
}
