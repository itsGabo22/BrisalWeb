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

/**
 * Materials with their product count, which is what the admin list shows and
 * what the delete guard reads. `_count` keeps it to one query rather than
 * fetching every product id just to measure the array.
 */
export async function GET() {
  const materials = await prisma.material.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json(
    materials.map((material) => ({
      ...toMaterial(material),
      productCount: material._count.products,
    })),
  );
}

export async function POST(request: Request) {
  try {
    const result = materialAdminSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const { name } = result.data;
    // An edited slug wins; otherwise it follows the name.
    const slug = slugify(result.data.slug?.trim() || name);

    if (!slug) {
      return NextResponse.json(
        { error: 'El nombre debe contener al menos una letra o número' },
        { status: 400 },
      );
    }

    const clash = await prisma.material.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (clash) {
      return NextResponse.json(
        { error: 'Ya existe un material con este nombre o slug' },
        { status: 409 },
      );
    }

    const created = await prisma.material.create({ data: { name, slug } });

    return NextResponse.json({ ...toMaterial(created), productCount: 0 }, { status: 201 });
  } catch (err) {
    console.error('[admin/materiales] Error al crear material:', err);
    return NextResponse.json({ error: 'Error al crear material' }, { status: 500 });
  }
}
