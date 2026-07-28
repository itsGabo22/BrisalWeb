import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { discountAdminSchema } from '@/lib/validators';
import { toDiscount } from '@/lib/repositories/mappers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = discountAdminSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const { couponCode, ...rest } = result.data;
    const updateData: Prisma.DiscountUpdateInput = { ...rest };
    if ('couponCode' in result.data) {
      updateData.code = couponCode ?? null;
    }

    const updated = await prisma.discount.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(toDiscount(updated));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 });
      }
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: 'Ya existe un descuento con este código de cupón' },
          { status: 409 },
        );
      }
    }
    console.error('[admin/descuentos/[id]] Error al actualizar descuento:', err);
    return NextResponse.json(
      { error: 'Error al actualizar descuento' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.discount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 });
    }
    console.error('[admin/descuentos/[id]] Error al eliminar descuento:', err);
    return NextResponse.json(
      { error: 'Error al eliminar descuento' },
      { status: 500 },
    );
  }
}
