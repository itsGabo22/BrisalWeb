import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { productAdminSchema } from '@/lib/validators';
import { toProduct } from '@/lib/repositories/mappers';
import { PRODUCT_INCLUDE } from '@/lib/repositories/product.repository';
import { collectProductImageUrls, reconcileBandejaAssignments } from '@/lib/admin/bandeja';
import {
  PRODUCT_FIELD_LABELS,
  PRODUCT_WRITE_MESSAGES,
  adminReadErrorResponse,
  invalidDataResponse,
  prismaWriteErrorResponse,
} from '@/lib/admin/admin-errors';

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
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(toProduct(product));
  } catch (err) {
    return adminReadErrorResponse('admin/productos/[id]', err);
  }
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
      return invalidDataResponse(result.error, PRODUCT_FIELD_LABELS);
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
      materialIds,
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
      // `set` replaces the whole selection in one statement, which is what the
      // form posts — and omitting the key entirely (form didn't send it) leaves
      // the existing materials untouched, matching every other field here.
      ...(materialIds !== undefined && {
        materials: { set: materialIds.map((materialId) => ({ id: materialId })) },
      }),
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

    // Same reasoning as the create route: the update has committed, so a
    // bandeja bookkeeping failure must not be reported as a failed save.
    try {
      await reconcileBandejaAssignments(updated.id, collectProductImageUrls(updated));
    } catch (bandejaErr) {
      console.error(
        `[admin/productos/[id]] Producto ${updated.id} actualizado, pero falló la reconciliación de la bandeja:`,
        bandejaErr,
      );
    }

    return NextResponse.json(toProduct(updated));
  } catch (err) {
    console.error('[admin/productos/[id]] Error al actualizar producto:', err);

    const mapped = prismaWriteErrorResponse(err, PRODUCT_WRITE_MESSAGES);
    if (mapped) return mapped;

    return NextResponse.json(
      { error: 'Error al actualizar producto. Revisa los datos e inténtalo de nuevo.' },
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

    /**
     * A real delete. This used to be a soft delete (`active: false`), which was
     * the source of the phantom "Borrador" state: the row survived, the list
     * relabelled it, and because `Product.categoryId` is NOT NULL with an
     * ON DELETE RESTRICT foreign key, that invisible tombstone then blocked its
     * category from ever being deleted — while the category guard, which only
     * counted ACTIVE products, waved the delete through into a raw FK error.
     *
     * Order history is unaffected: `OrderItem` deliberately stores `productId`
     * as a plain column with NO foreign key, and snapshots `name`, `price`,
     * `imageUrl`, `color` and `reference` at order time, so what was shipped
     * stays readable after the product is gone. Reviews, colour variants and
     * tag links all cascade.
     */
    await prisma.$transaction(async (tx) => {
      // PRODUCT-scoped discounts would otherwise be left with a null productId
      // by the optional relation's SET NULL, which reads as a global discount.
      await tx.discount.deleteMany({ where: { productId: id, scope: 'PRODUCT' } });
      await tx.product.delete({ where: { id } });
    });

    // Frees the bandeja rows this product held so the images return to the tray
    // rather than staying assigned to an id that no longer exists.
    await reconcileBandejaAssignments(id, []);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/productos/[id]] Error al eliminar producto:', err);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 },
    );
  }
}
