import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminReadErrorResponse } from '@/lib/admin/admin-errors';

export async function GET() {
  try {
    const [pendingOrders, pendingWholesalers, pendingReviews] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING_WHATSAPP' } }),
      prisma.user.count({ where: { role: 'MAYORISTA', approved: false } }),
      prisma.review.count({ where: { status: 'PENDING' } }),
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

    // Nothing a shopper writes is public until it is read here, so an unattended
    // pending review is a review nobody can see — it belongs in the bell.
    if (pendingReviews > 0) {
      notifications.push({
        id: 'pending-reviews',
        message: `${pendingReviews} reseña${pendingReviews === 1 ? '' : 's'} por moderar`,
        href: '/admin/resenas',
        count: pendingReviews,
      });
    }

    return NextResponse.json({
      notifications,
      total: pendingOrders + pendingWholesalers + pendingReviews,
    });
  } catch (err) {
    return adminReadErrorResponse('admin/notificaciones', err);
  }
}
