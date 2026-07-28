import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { discountAdminSchema } from '@/lib/validators';
import { toDiscount } from '@/lib/repositories/mappers';

export async function GET() {
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(discounts.map(toDiscount));
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

    const { couponCode, ...rest } = result.data;

    const newDiscount = await prisma.discount.create({
      data: { ...rest, code: couponCode ?? null },
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
