import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { materialAdminSchema } from '@/lib/validators';
import { toMaterial } from '@/lib/repositories/mappers';

export const runtime = 'nodejs';

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
    const result = materialAdminSchema.partial().safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });
    }

    const name = result.data.name ?? existing.name;
    // Only re-derive the slug from the name when the form did not send one of
    // its own, so a hand-edited slug survives a later rename.
    const slug = slugify(result.data.slug?.trim() || (result.data.name ? name : existing.slug));

    if (!slug) {
      return NextResponse.json(
        { error: 'El nombre debe contener al menos una letra o número' },
        { status: 400 },
      );
    }

    const clash = await prisma.material.findFirst({
      where: { OR: [{ name }, { slug }], NOT: { id } },
    });
    if (clash) {
      return NextResponse.json(
        { error: 'Ya existe otro material con este nombre o slug' },
        { status: 409 },
      );
    }

    const updated = await prisma.material.update({
      where: { id },
      data: { name, slug },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({
      ...toMaterial(updated),
      productCount: updated._count.products,
    });
  } catch (err) {
    console.error('[admin/materiales/[id]] Error al actualizar material:', err);
    return NextResponse.json(
      { error: 'Error al actualizar material' },
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

    const existing = await prisma.material.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Material no encontrado' }, { status: 404 });
    }

    /**
     * Same guard as category deletion. The m2m rows would cascade away happily,
     * so nothing in the database stops this — which is exactly why it is
     * checked here: silently stripping a material from nine products is not
     * what "eliminar material" is asking for.
     */
    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar «${existing.name}» porque ${existing._count.products} producto(s) lo usan. Quítalo de esos productos primero.`,
        },
        { status: 409 },
      );
    }

    await prisma.material.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/materiales/[id]] Error al eliminar material:', err);
    return NextResponse.json(
      { error: 'Error al eliminar material' },
      { status: 500 },
    );
  }
}
