import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productAdminSchema } from '@/lib/validators';
import { toProduct } from '@/lib/repositories/mappers';
import { PRODUCT_INCLUDE } from '@/lib/repositories/product.repository';
import { collectProductImageUrls, reconcileBandejaAssignments } from '@/lib/admin/bandeja';
import { invalidProductDataResponse, productWriteErrorResponse } from '@/lib/admin/product-errors';

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
      return invalidProductDataResponse(result.error);
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
        // `connect`, not `create`: materials are a shared vocabulary managed in
        // /admin/materiales, so a product only ever links to existing rows.
        materials: { connect: materialIds.map((materialId) => ({ id: materialId })) },
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

    // Deliberately not fatal. The product is already committed at this point,
    // so letting a bandeja bookkeeping failure reach the catch below would
    // answer 500 for a product that WAS created — the admin then retries and
    // gets a 409 for a duplicate name, with no way to understand either. The
    // images stay claimable and a later save reconciles them.
    try {
      await reconcileBandejaAssignments(
        newProduct.id,
        collectProductImageUrls(newProduct),
      );
    } catch (bandejaErr) {
      console.error(
        `[admin/productos] Producto ${newProduct.id} creado, pero falló la reconciliación de la bandeja:`,
        bandejaErr,
      );
    }

    return NextResponse.json(toProduct(newProduct), { status: 201 });
  } catch (err) {
    console.error('[admin/productos] Error al crear producto:', err);

    // Name the actual problem (duplicate SKU, missing category, stale material)
    // when we recognise it; only a genuine unknown falls through to 500.
    const mapped = productWriteErrorResponse(err);
    if (mapped) return mapped;

    return NextResponse.json(
      { error: 'Error al crear producto. Revisa los datos e inténtalo de nuevo.' },
      { status: 500 },
    );
  }
}
