import { NextResponse } from 'next/server';
import { discountStore } from '@/lib/stores/adminStore';
import { discountAdminSchema } from '@/lib/validators';

export async function GET() {
  const discounts = discountStore.getAll();
  return NextResponse.json(discounts);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = discountAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const newDiscount = discountStore.create(result.data);
    return NextResponse.json(newDiscount, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear descuento' },
      { status: 500 }
    );
  }
}
