import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { formatCOP } from '@/lib/utils/pricing';

function buildWhatsAppMessage(
  orderId: string,
  items: {
    name: string;
    price: number;
    quantity: number;
    color?: string | null;
    reference?: string | null;
  }[],
  total: number,
  customerName: string,
  customerPhone: string,
): string {
  const orderCode = orderId.slice(-6).toUpperCase();

  /**
   * Two lines of the same product in different colours have to be tellable
   * apart at a glance — this message is what the client packs from. Colour is
   * only printed when there is one, so a simple product doesn't get an empty
   * "Color:" label.
   */
  const itemLines = items
    .map((item) => {
      const color = item.color ? ` — Color: ${item.color}` : '';
      const reference = item.reference ? ` (Ref: ${item.reference})` : '';
      const amount = formatCOP(item.price * item.quantity);
      return `• ${item.name}${color}${reference}\n  x${item.quantity} = ${amount}`;
    })
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
            reference: item.reference ?? null,
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
