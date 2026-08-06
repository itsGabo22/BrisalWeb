import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryAdminSchema } from '@/lib/validators';
import { toCategory } from '@/lib/repositories/mappers';
import {
  parseCategoryFormData,
  revalidateCategorySurfaces,
  uploadCategoryImage,
} from '@/lib/admin/category-image';

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

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(categories.map((category) => toCategory(category)));
}

export async function POST(request: Request) {
  try {
    // The admin form posts multipart/form-data so it can carry the showcase
    // image. JSON is still accepted so any other caller (or a seed script)
    // keeps working unchanged.
    const isFormData = request.headers
      .get('content-type')
      ?.includes('multipart/form-data');

    let fields: unknown;
    let imageFile: File | null = null;

    if (isFormData) {
      const parsed = parseCategoryFormData(await request.formData());
      fields = parsed.fields;
      imageFile = parsed.imageFile;
    } else {
      fields = await request.json();
    }

    const result = categoryAdminSchema.safeParse(fields);

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

    let imageUrl = result.data.imageUrl ?? null;
    if (imageFile) {
      const uploaded = await uploadCategoryImage(imageFile, slug);
      if ('error' in uploaded) {
        return NextResponse.json({ error: uploaded.error }, { status: 400 });
      }
      imageUrl = uploaded.url;
    }

    const newCategory = await prisma.category.create({
      data: { ...result.data, slug, imageUrl },
    });

    revalidateCategorySurfaces();

    return NextResponse.json(toCategory(newCategory), { status: 201 });
  } catch (err) {
    console.error('[admin/categorias] Error al crear categoría:', err);
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 },
    );
  }
}
