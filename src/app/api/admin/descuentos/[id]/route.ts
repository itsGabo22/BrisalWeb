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

    const { couponCode, productIds, ...rest } = result.data;
    const updateData: Prisma.DiscountUpdateInput = { ...rest };
    if ('couponCode' in result.data) {
      updateData.code = couponCode ?? null;
    }

    /**
     * `set` replaces the whole selection in one statement, which is what the
     * picker posts. The key is only present when the form actually sent it, so
     * a partial PATCH — the active toggle in the list, or a "Renovar" that only
     * moves the dates — leaves the product selection untouched.
     */
    if ('productIds' in result.data && productIds) {
      const scope = result.data.scope;
      // Switching a campaign away from PRODUCT scope clears its links rather
      // than leaving orphans that would reappear if it switched back.
      updateData.products =
        scope !== undefined && scope !== 'PRODUCT'
          ? { set: [] }
          : { set: productIds.map((productId) => ({ id: productId })) };
    }

    const updated = await prisma.discount.update({
      where: { id },
      data: updateData,
      include: { products: { select: { id: true } } },
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
