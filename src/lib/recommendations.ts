/**
 * "Frequently bought together" — an honest, data-derived signal from confirmed
 * WhatsApp orders' item co-occurrence. NOT personalized (there's no customer
 * login to build per-person history on) — this is a store-wide pattern: given
 * this product, which OTHER products most often appear in the same confirmed order.
 *
 * Returns null when there isn't enough order history yet, so the caller can
 * fall back to category/tag-based related products instead of showing a
 * sparse or misleadingly-labeled section.
 */
import { prisma } from '@/lib/prisma';
import { PRODUCT_INCLUDE } from '@/lib/repositories/product.repository';
import { toProduct } from '@/lib/repositories/mappers';
import type { Product } from '@/types';

const MIN_QUALIFYING_ORDERS = 3;

export async function getFrequentlyBoughtTogether(
  productId: string,
  limit = 4,
): Promise<Product[] | null> {
  const qualifyingOrders = await prisma.order.count({
    where: { status: 'CONFIRMED', items: { some: { productId } } },
  });

  if (qualifyingOrders < MIN_QUALIFYING_ORDERS) {
    return null;
  }

  const coOccurring = await prisma.orderItem.findMany({
    where: {
      productId: { not: productId },
      order: {
        status: 'CONFIRMED',
        items: { some: { productId } },
      },
    },
    select: { productId: true },
  });

  if (coOccurring.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const item of coOccurring) {
    counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
  }

  const topIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) {
    return null;
  }

  const products = await prisma.product.findMany({
    where: { id: { in: topIds }, active: true },
    include: PRODUCT_INCLUDE,
  });

  if (products.length === 0) {
    return null;
  }

  // Preserve frequency order — findMany({ where: { id: { in } } }) doesn't guarantee it.
  const productMap = new Map(products.map((p) => [p.id, p]));
  const ordered = topIds
    .map((id) => productMap.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return ordered.map(toProduct);
}
