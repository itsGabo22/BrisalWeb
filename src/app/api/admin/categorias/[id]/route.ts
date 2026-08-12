import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryAdminSchema } from '@/lib/validators';
import { toCategory } from '@/lib/repositories/mappers';
import {
  CATEGORY_IMAGE_BUCKET,
  parseCategoryFormData,
  revalidateCategorySurfaces,
  uploadCategoryImage,
} from '@/lib/admin/category-image';
import { deleteFromStorageByUrl } from '@/lib/supabase/storage';

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

    const isFormData = request.headers
      .get('content-type')
      ?.includes('multipart/form-data');

    let body: unknown;
    let imageFile: File | null = null;

    if (isFormData) {
      const parsed = parseCategoryFormData(await request.formData());
      body = parsed.fields;
      imageFile = parsed.imageFile;
    } else {
      body = await request.json();
    }

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

    // Existing-image fallback. `parseCategoryFormData` only emits an `imageUrl`
    // key when the form actually sent one, and `.partial()` keeps it absent
    // otherwise — so renaming a category cannot blank its showcase image. The
    // old file is only removed once its replacement has uploaded successfully.
    if (imageFile) {
      const uploaded = await uploadCategoryImage(
        imageFile,
        updateData.slug ?? existing.slug,
      );
      if ('error' in uploaded) {
        return NextResponse.json({ error: uploaded.error }, { status: 400 });
      }
      updateData.imageUrl = uploaded.url;
      if (existing.imageUrl) {
        await deleteFromStorageByUrl(CATEGORY_IMAGE_BUCKET, existing.imageUrl);
      }
    } else if (updateData.imageUrl === null && existing.imageUrl) {
      // Explicit removal from the admin UI.
      await deleteFromStorageByUrl(CATEGORY_IMAGE_BUCKET, existing.imageUrl);
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    revalidateCategorySurfaces();

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

    /**
     * Counts EVERY product in the category, not just the active ones.
     *
     * `Product.categoryId` is NOT NULL behind an ON DELETE RESTRICT foreign
     * key, so an inactive product blocks the delete in Postgres exactly as hard
     * as an active one does. The old guard filtered on `active: true`, which
     * meant a hidden product let the check pass and the delete then died on a
     * raw FK violation reported as a generic 500 — the category stayed, and so
     * did its parent, with nothing on screen explaining why.
     */
    const [childCount, productCount] = await Promise.all([
      prisma.category.count({ where: { parentId: id } }),
      prisma.product.count({ where: { categoryId: id } }),
    ]);

    const label = existing.parentId ? 'subcategoría' : 'categoría';

    if (childCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar «${existing.name}» porque tiene ${childCount} subcategoría(s). Elimínalas primero.`,
        },
        { status: 409 },
      );
    }

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la ${label} «${existing.name}» porque tiene ${productCount} producto(s) asociado(s). Reasígnalos a otra ${label} o elimínalos primero.`,
        },
        { status: 409 },
      );
    }

    if (existing.imageUrl) {
      await deleteFromStorageByUrl(CATEGORY_IMAGE_BUCKET, existing.imageUrl);
    }
    await prisma.category.delete({ where: { id } });

    revalidateCategorySurfaces();

    return NextResponse.json({ success: true });
  } catch (err) {
    // Backstop for anything the guards above cannot see — a row written between
    // the count and the delete, or a relation added later. Without this, a
    // foreign-key refusal surfaces as an opaque 500 rather than as the
    // actionable "something still points at this" that it actually is.
    if (
      typeof err === 'object' &&
      err !== null &&
      (err as { code?: string }).code === 'P2003'
    ) {
      return NextResponse.json(
        {
          error:
            'No se puede eliminar porque todavía hay elementos asociados a esta categoría.',
        },
        { status: 409 },
      );
    }
    console.error('[admin/categorias/[id]] Error al eliminar categoría:', err);
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 },
    );
  }
}
