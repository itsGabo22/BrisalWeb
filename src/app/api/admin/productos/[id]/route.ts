import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { productAdminSchema } from '@/lib/validators';
import { toProduct } from '@/lib/repositories/mappers';
import { PRODUCT_INCLUDE } from '@/lib/repositories/product.repository';
import { collectProductImageUrls, reconcileBandejaAssignments } from '@/lib/admin/bandeja';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  });

  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json(toProduct(product));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = productAdminSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const {
      name,
      price,
      comparePrice,
      wholesalePrice,
      categoryId,
      sku,
      stock,
      material,
      colorName,
      colorHex,
      description,
      imageUrls,
      featured,
      active,
      tagIds,
      colorVariants,
    } = result.data;

    /**
     * Every field is spread conditionally on `!== undefined`, which is the
     * existing-record fallback: the form only sends what it means to change,
     * so editing a name can't blank the description or wipe the variants.
     */
    const updateData: Prisma.ProductUpdateInput = {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
      ...(comparePrice !== undefined && { comparePrice }),
      ...(wholesalePrice !== undefined && { wholesalePrice }),
      ...(categoryId !== undefined && { categoryId }),
      ...(sku !== undefined && { sku }),
      ...(stock !== undefined && { stock }),
      ...(material !== undefined && { material }),
      ...(colorName !== undefined && {
        colorName: colorName?.trim() ? colorName.trim() : null,
      }),
      ...(colorHex !== undefined && {
        colorHex: colorHex?.trim() ? colorHex.trim() : null,
      }),
      ...(description !== undefined && {
        description: description?.trim() ? description.trim() : null,
      }),
      ...(imageUrls !== undefined && { imageUrls }),
      ...(featured !== undefined && { featured }),
      ...(active !== undefined && { active }),
    };

    /**
     * Variants are replaced wholesale when the form sends them.
     *
     * Delete-then-recreate rather than upsert: the editor lets the client
     * reorder and remove colours freely, so diffing by id would mean tracking
     * client-side ids through every reorder for no benefit. `order` is
     * reassigned from array position, and `imageUrls` arrives on each variant,
     * so a save without re-uploading keeps the images the form already holds.
     * Wrapped with the product update in one transaction so a failure halfway
     * cannot leave the product with its colours deleted.
     */
    if (colorVariants !== undefined) {
      updateData.colorVariants = {
        deleteMany: {},
        create: colorVariants.map((variant, index) => ({
          colorName: variant.colorName.trim(),
          colorHex: variant.colorHex,
          imageUrls: variant.imageUrls,
          price: variant.price ?? null,
          wholesalePrice: variant.wholesalePrice ?? null,
          stock: variant.stock,
          order: index,
        })),
      };
    }

    if (name) {
      const slug = slugify(name);
      const slugOwner = await prisma.product.findUnique({ where: { slug } });
      if (slugOwner && slugOwner.id !== id) {
        return NextResponse.json(
          { error: 'Ya existe otro producto con este nombre' },
          { status: 409 },
        );
      }
      updateData.slug = slug;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds) {
        await tx.productTag.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...updateData,
          ...(tagIds
            ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } }
            : {}),
        },
        include: PRODUCT_INCLUDE,
      });
    });

    await reconcileBandejaAssignments(updated.id, collectProductImageUrls(updated));

    return NextResponse.json(toProduct(updated));
  } catch (err) {
    console.error('[admin/productos/[id]] Error al actualizar producto:', err);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
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
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Soft delete — products stay in the DB (order history, etc.) but drop off the catalog.
    await prisma.product.update({ where: { id }, data: { active: false } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/productos/[id]] Error al eliminar producto:', err);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 },
    );
  }
}
