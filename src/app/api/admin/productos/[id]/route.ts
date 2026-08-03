import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { productAdminSchema } from '@/lib/validators';
import { toProduct } from '@/lib/repositories/mappers';

const PRODUCT_INCLUDE = {
  category: true,
  tags: { include: { tag: true } },
  discounts: true,
} satisfies Prisma.ProductInclude;

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

    // variants/customAttributes have no Prisma columns yet — not persisted.
    const {
      name,
      price,
      comparePrice,
      wholesalePrice,
      categoryId,
      sku,
      stock,
      material,
      imageUrls,
      featured,
      active,
      tagIds,
    } = result.data;

    const updateData: Prisma.ProductUpdateInput = {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
      ...(comparePrice !== undefined && { comparePrice }),
      ...(wholesalePrice !== undefined && { wholesalePrice }),
      ...(categoryId !== undefined && { categoryId }),
      ...(sku !== undefined && { sku }),
      ...(stock !== undefined && { stock }),
      ...(material !== undefined && { material }),
      ...(imageUrls !== undefined && { imageUrls }),
      ...(featured !== undefined && { featured }),
      ...(active !== undefined && { active }),
    };

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
