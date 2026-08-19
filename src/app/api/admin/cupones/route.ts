import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { couponAdminSchema } from '@/lib/validators';
import { toCoupon } from '@/lib/repositories/mappers';
import { adminReadErrorResponse } from '@/lib/admin/admin-errors';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(coupons.map(toCoupon));
  } catch (err) {
    return adminReadErrorResponse('admin/cupones', err);
  }
}

export async function POST(request: Request) {
  try {
    const result = couponAdminSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const { startsAt, endsAt, ...rest } = result.data;

    if (startsAt && endsAt && startsAt > endsAt) {
      return NextResponse.json(
        { error: 'La fecha de inicio no puede ser posterior a la de fin' },
        { status: 400 },
      );
    }

    const created = await prisma.coupon.create({
      data: { ...rest, startsAt, endsAt },
    });

    return NextResponse.json(toCoupon(created), { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un cupón con este código' }, { status: 409 });
    }
    console.error('[admin/cupones] Error al crear cupón:', err);
    return NextResponse.json({ error: 'Error al crear cupón' }, { status: 500 });
  }
}
