import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { discountAdminSchema } from '@/lib/validators';
import { toDiscount } from '@/lib/repositories/mappers';
import { adminReadErrorResponse } from '@/lib/admin/admin-errors';

export async function GET() {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
      // Ids only: the admin list renders a count and the form pre-checks boxes,
      // and neither needs the full product rows it already fetched separately.
      include: { products: { select: { id: true } } },
    });

    return NextResponse.json(discounts.map(toDiscount));
  } catch (err) {
    return adminReadErrorResponse('admin/descuentos', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = discountAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const { couponCode, productIds, scope, ...rest } = result.data;

    const newDiscount = await prisma.discount.create({
      data: {
        ...rest,
        scope,
        code: couponCode ?? null,
        // Only a PRODUCT-scoped campaign links products. A GLOBAL or CATEGORY
        // discount that somehow arrived with ids would otherwise carry a
        // selection that nothing reads and that the form would show back.
        ...(scope === 'PRODUCT' && productIds.length > 0
          ? { products: { connect: productIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { products: { select: { id: true } } },
    });

    return NextResponse.json(toDiscount(newDiscount), { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un descuento con este código de cupón' },
        { status: 409 },
      );
    }
    console.error('[admin/descuentos] Error al crear descuento:', err);
    return NextResponse.json(
      { error: 'Error al crear descuento' },
      { status: 500 },
    );
  }
}
