import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFromStorageByUrl } from '@/lib/supabase/storage';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const image = await prisma.imageBandeja.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    await deleteFromStorageByUrl('product-images', image.url);
    await prisma.imageBandeja.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/imagenes/[id]] Error al eliminar imagen:', err);
    return NextResponse.json({ error: 'Error al eliminar imagen' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { productId } = body as { productId?: string | null };

    if (typeof productId !== 'string' && productId !== null) {
      return NextResponse.json({ error: 'productId inválido' }, { status: 400 });
    }

    const image = await prisma.imageBandeja.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    const updated = await prisma.imageBandeja.update({
      where: { id },
      data: {
        productId,
        assigned: productId !== null,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[admin/imagenes/[id]] Error al asignar imagen:', err);
    return NextResponse.json({ error: 'Error al asignar imagen' }, { status: 500 });
  }
}
