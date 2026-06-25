import { NextResponse } from 'next/server';
import { discountStore } from '@/lib/stores/adminStore';
import { discountAdminSchema } from '@/lib/validators';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = discountAdminSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const updated = discountStore.update(id, result.data);
    if (!updated) {
      return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar descuento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = discountStore.delete(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Descuento no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
