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

export async function GET() {
  const products = await prisma.product.findMany({
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(products.map(toProduct));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = productAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.format() },
        { status: 400 },
      );
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
    const slug = slugify(name);

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un producto con este nombre' },
        { status: 409 },
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
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
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
      include: PRODUCT_INCLUDE,
    });

    return NextResponse.json(toProduct(newProduct), { status: 201 });
  } catch (err) {
    console.error('[admin/productos] Error al crear producto:', err);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 },
    );
  }
}
