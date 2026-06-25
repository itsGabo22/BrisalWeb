import { NextResponse } from 'next/server';
import type { Category } from '@/types';
import { categoryStore } from '@/lib/stores/adminStore';
import { categoryAdminSchema } from '@/lib/validators';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = categoryAdminSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const updateData: Partial<Category> = { ...result.data };
    
    if (result.data.name) {
      const slug = slugify(result.data.name);
      // Check if another category has this slug
      const existing = categoryStore.getBySlug(slug);
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Ya existe otra categoría con este nombre' },
          { status: 400 }
        );
      }
      updateData.slug = slug;
    }

    const updated = categoryStore.update(id, updateData);
    if (!updated) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = categoryStore.delete(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
