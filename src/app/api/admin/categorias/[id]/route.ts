import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryAdminSchema } from '@/lib/validators';
import { toCategory } from '@/lib/repositories/mappers';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = categoryAdminSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const { name, ...rest } = result.data;
    const updateData: typeof rest & { slug?: string; name?: string } = { ...rest };

    if (name) {
      const slug = slugify(name);
      const slugOwner = await prisma.category.findUnique({ where: { slug } });
      if (slugOwner && slugOwner.id !== id) {
        return NextResponse.json(
          { error: 'Ya existe otra categoría con este nombre' },
          { status: 409 },
        );
      }
      updateData.name = name;
      updateData.slug = slug;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(toCategory(updated));
  } catch (err) {
    console.error('[admin/categorias/[id]] Error al actualizar categoría:', err);
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
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

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const [childCount, activeProductCount] = await Promise.all([
      prisma.category.count({ where: { parentId: id } }),
      prisma.product.count({ where: { categoryId: id, active: true } }),
    ]);

    if (childCount > 0) {
      return NextResponse.json(
        { error: 'Esta categoría tiene subcategorías. Elimínalas primero.' },
        { status: 409 },
      );
    }

    if (activeProductCount > 0) {
      return NextResponse.json(
        {
          error: `Esta categoría tiene ${activeProductCount} producto(s) activo(s). Reasígnalos o desactívalos primero.`,
        },
        { status: 409 },
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/categorias/[id]] Error al eliminar categoría:', err);
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 },
    );
  }
}
