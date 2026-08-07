import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { formatCOP } from '@/lib/utils/pricing';

function buildWhatsAppMessage(
  orderId: string,
  items: { name: string; price: number; quantity: number; color?: string | null }[],
  total: number,
  customerName: string,
  customerPhone: string,
): string {
  const orderCode = orderId.slice(-6).toUpperCase();
  const itemLines = items
    .map(
      (item) =>
        // The colour is part of what was ordered, so it has to survive into
        // the WhatsApp message the client actually reads when packing.
        `• ${item.name}${item.color ? ` (${item.color})` : ''} x${item.quantity} = ` +
        formatCOP(item.price * item.quantity),
    )
    .join('\n');

  return (
    `¡Hola Brisal! Quiero hacer el siguiente pedido:\n\n` +
    `Pedido #${orderCode}\n` +
    `${itemLines}\n` +
    `─────────────────\n` +
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

  const { items, total, customerName, customerPhone, wholesaleUserId } = parsed.data;

  try {
    const order = await prisma.order.create({
      data: {
        total,
        status: 'PENDING_WHATSAPP',
        customerName,
        customerPhone,
        wholesaleUserId: wholesaleUserId ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl ?? null,
            color: item.color ?? null,
          })),
        },
      },
    });

    if (wholesaleUserId) {
      await prisma.user
        .update({ where: { id: wholesaleUserId }, data: { lastOrderAt: new Date() } })
        .catch(() => {});
    }

    const message = buildWhatsAppMessage(order.id, items, total, customerName, customerPhone);
    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ orderId: order.id, whatsappUrl }, { status: 201 });
  } catch (err) {
    console.error('[ordenes] Error al crear la orden:', err);
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 });
  }
}
