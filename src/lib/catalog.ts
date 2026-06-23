import type { Product, Tag } from '@/types';

export type CatalogSearchParams = Promise<{
  tag?: string | string[];
}>;

export function normalizeTagParam(tag: string | string[] | undefined) {
  return typeof tag === 'string' && tag.length > 0 ? tag : undefined;
}

export function getUniqueTags(products: Product[]): Tag[] {
  const tagsBySlug = new Map<string, Tag>();

  for (const product of products) {
    for (const tag of product.tags) {
      if (!tagsBySlug.has(tag.slug)) {
        tagsBySlug.set(tag.slug, tag);
      }
    }
  }

  return Array.from(tagsBySlug.values());
}

export function filterProductsByTag(products: Product[], tagSlug?: string) {
  if (!tagSlug) return products;
  return products.filter((product) =>
    product.tags.some((tag) => tag.slug === tagSlug),
  );
}
