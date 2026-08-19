import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryAdminSchema } from '@/lib/validators';
import { toCategory } from '@/lib/repositories/mappers';
import {
  parseCategoryFormData,
  revalidateCategorySurfaces,
  uploadCategoryImage,
} from '@/lib/admin/category-image';
import {
  CATEGORY_FIELD_LABELS,
  CATEGORY_WRITE_MESSAGES,
  adminReadErrorResponse,
  invalidDataResponse,
  prismaWriteErrorResponse,
} from '@/lib/admin/admin-errors';

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
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(categories.map((category) => toCategory(category)));
  } catch (err) {
    return adminReadErrorResponse('admin/categorias', err);
  }
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
      return invalidDataResponse(result.error, CATEGORY_FIELD_LABELS);
    }

    // Checked here rather than left to the foreign key. A parent that has since
    // been deleted is an ordinary stale-form situation, and Postgres answers it
    // with a constraint violation that reads as a server fault; this says what
    // the admin has to do instead. The FK is still the backstop for a row
    // deleted between this check and the insert.
    if (result.data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: result.data.parentId },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json(
          {
            error:
              'La categoría padre seleccionada ya no existe. Recarga la página y vuelve a elegirla.',
          },
          { status: 400 },
        );
      }
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

    const mapped = prismaWriteErrorResponse(err, CATEGORY_WRITE_MESSAGES);
    if (mapped) return mapped;

    return NextResponse.json(
      { error: 'Error al crear categoría. Revisa los datos e inténtalo de nuevo.' },
      { status: 500 },
    );
  }
}
