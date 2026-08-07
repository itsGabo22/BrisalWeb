import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validators';
import { formatCOP } from '@/lib/utils/pricing';
import { computeBackorderQty, getAvailableStock } from '@/lib/orders/backorder';

interface MessageItem {
  name: string;
  price: number;
  quantity: number;
  color?: string | null;
  reference?: string | null;
  /** 0 when the line was fully in stock. */
  backorderQty: number;
}

function buildWhatsAppMessage(
  orderId: string,
  items: MessageItem[],
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
   *
   * A backordered line gets one extra line naming the MISSING quantity, not the
   * ordered one: that number is what the client has to produce or restock. A
   * fully in-stock line is left exactly as it was.
   */
  const itemLines = items
    .map((item) => {
      const color = item.color ? ` — Color: ${item.color}` : '';
      const reference = item.reference ? ` (Ref: ${item.reference})` : '';
      const amount = formatCOP(item.price * item.quantity);
      const backorder =
        item.backorderQty > 0
          ? `\n  ⚠️ SOBRE PEDIDO: faltan ${item.backorderQty} ${
              item.backorderQty === 1 ? 'unidad' : 'unidades'
            } por reponer`
          : '';
      return `• ${item.name}${color}${reference}\n  x${item.quantity} = ${amount}${backorder}`;
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
    /**
     * Stock is read HERE rather than trusted from the client: the cart may have
     * been sitting in localStorage for days, and the shopper can't be the one
     * who decides how much of a colour exists.
     *
     * Insufficient stock deliberately does NOT reject the order — that is the
     * whole point of sobrepedido. It is recorded per line instead.
     */
    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(items.map((item) => item.productId))] } },
      include: { colorVariants: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const linesWithBackorder = items.map((item) => {
      const product = productMap.get(item.productId);
      // A product that no longer exists can't be checked against stock; the
      // line is recorded as ordered rather than silently flagged.
      const available = product
        ? getAvailableStock(product, {
            colorVariantId: item.colorVariantId,
            color: item.color,
          })
        : item.quantity;

      return {
        ...item,
        backorderQty: computeBackorderQty(item.quantity, available),
      };
    });

    const order = await prisma.order.create({
      data: {
        total,
        status: 'PENDING_WHATSAPP',
        customerName,
        customerPhone,
        wholesaleUserId: wholesaleUserId ?? null,
        items: {
          create: linesWithBackorder.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl ?? null,
            color: item.color ?? null,
            colorVariantId: item.colorVariantId ?? null,
            reference: item.reference ?? null,
            backorderQty: item.backorderQty,
          })),
        },
      },
    });

    if (wholesaleUserId) {
      await prisma.user
        .update({ where: { id: wholesaleUserId }, data: { lastOrderAt: new Date() } })
        .catch(() => {});
    }

    const message = buildWhatsAppMessage(
      order.id,
      linesWithBackorder,
      total,
      customerName,
      customerPhone,
    );
    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ orderId: order.id, whatsappUrl }, { status: 201 });
  } catch (err) {
    console.error('[ordenes] Error al crear la orden:', err);
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 });
  }
}
