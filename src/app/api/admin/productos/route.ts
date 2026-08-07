import { NextResponse } from 'next/server';
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
        colorName: colorName?.trim() ? colorName.trim() : null,
        colorHex: colorHex?.trim() ? colorHex.trim() : null,
        description: description?.trim() ? description.trim() : null,
        imageUrls,
        featured,
        active,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        colorVariants: {
          create: colorVariants.map((variant, index) => ({
            colorName: variant.colorName.trim(),
            colorHex: variant.colorHex,
            imageUrls: variant.imageUrls,
            price: variant.price ?? null,
            wholesalePrice: variant.wholesalePrice ?? null,
            stock: variant.stock,
            // Index wins over any client-sent order so the saved order always
            // matches the order the client sees in the editor.
            order: index,
          })),
        },
      },
      include: PRODUCT_INCLUDE,
    });

    await reconcileBandejaAssignments(
      newProduct.id,
      collectProductImageUrls(newProduct),
    );

    return NextResponse.json(toProduct(newProduct), { status: 201 });
  } catch (err) {
    console.error('[admin/productos] Error al crear producto:', err);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 },
    );
  }
}
