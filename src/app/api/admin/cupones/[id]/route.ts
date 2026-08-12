import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { couponAdminSchema } from '@/lib/validators';
import { toCoupon } from '@/lib/repositories/mappers';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = couponAdminSchema.partial().safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
    }

    const data = result.data;
    const startsAt = 'startsAt' in data ? data.startsAt : existing.startsAt;
    const endsAt = 'endsAt' in data ? data.endsAt : existing.endsAt;

    if (startsAt && endsAt && startsAt > endsAt) {
      return NextResponse.json(
        { error: 'La fecha de inicio no puede ser posterior a la de fin' },
        { status: 400 },
      );
    }

    /**
     * `usageCount` is deliberately NOT editable here. It is the redemption
     * ledger, incremented only by the atomic guard in the order route — letting
     * the form write it would hand a race a second way to go wrong.
     */
    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.percentage !== undefined && { percentage: data.percentage }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit }),
        ...('startsAt' in data && { startsAt: data.startsAt }),
        ...('endsAt' in data && { endsAt: data.endsAt }),
      },
    });

    return NextResponse.json(toCoupon(updated));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un cupón con este código' }, { status: 409 });
    }
    console.error('[admin/cupones/[id]] Error al actualizar cupón:', err);
    return NextResponse.json({ error: 'Error al actualizar cupón' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
    }
    console.error('[admin/cupones/[id]] Error al eliminar cupón:', err);
    return NextResponse.json({ error: 'Error al eliminar cupón' }, { status: 500 });
  }
}
