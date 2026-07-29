import { NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories';

const PREVIEW_LIMIT = 6;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();

  if (!query) {
    return NextResponse.json({ products: [] });
  }

  const products = await productRepository.search(query);

  return NextResponse.json({
    products: products.slice(0, PREVIEW_LIMIT).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrls[0] ?? null,
    })),
    total: products.length,
  });
}
