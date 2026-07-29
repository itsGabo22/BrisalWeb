import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [pendingOrders, pendingWholesalers] = await Promise.all([
    prisma.order.count({ where: { status: 'PENDING_WHATSAPP' } }),
    prisma.user.count({ where: { role: 'MAYORISTA', approved: false } }),
  ]);

  const notifications: { id: string; message: string; href: string; count: number }[] = [];

  if (pendingOrders > 0) {
    notifications.push({
      id: 'pending-orders',
      message: `${pendingOrders} pedido${pendingOrders === 1 ? '' : 's'} pendiente${pendingOrders === 1 ? '' : 's'} de confirmación`,
      href: '/admin',
      count: pendingOrders,
    });
  }

  if (pendingWholesalers > 0) {
    notifications.push({
      id: 'pending-wholesalers',
      message: `${pendingWholesalers} solicitud${pendingWholesalers === 1 ? '' : 'es'} mayorista${pendingWholesalers === 1 ? '' : 's'} por revisar`,
      href: '/admin/mayoristas',
      count: pendingWholesalers,
    });
  }

  return NextResponse.json({
    notifications,
    total: pendingOrders + pendingWholesalers,
  });
}
