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

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(categories.map((category) => toCategory(category)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = categoryAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const slug = slugify(result.data.name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con este nombre' },
        { status: 409 },
      );
    }

    const newCategory = await prisma.category.create({
      data: { ...result.data, slug },
    });

    return NextResponse.json(toCategory(newCategory), { status: 201 });
  } catch (err) {
    console.error('[admin/categorias] Error al crear categoría:', err);
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 },
    );
  }
}
