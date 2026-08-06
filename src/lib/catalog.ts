import type { Product, Tag } from '@/types';
import { hasActiveSalePrice } from '@/lib/utils/pricing';

export type CatalogSearchParams = Promise<{
  tag?: string | string[];
  sort?: string | string[];
  filter?: string | string[];
}>;

/** The `sort` values the intent nav emits. Anything else is ignored. */
export type CatalogSort = 'nuevo';

/** The `filter` values the intent nav emits. Anything else is ignored. */
export type CatalogFilter = 'descuento';

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value)) return value.find((entry) => entry.length > 0);
  return undefined;
}

export function normalizeTagParam(tag: string | string[] | undefined) {
  return firstString(tag);
}

export function normalizeSortParam(
  sort: string | string[] | undefined,
): CatalogSort | undefined {
  return firstString(sort) === 'nuevo' ? 'nuevo' : undefined;
}

export function normalizeFilterParam(
  filter: string | string[] | undefined,
): CatalogFilter | undefined {
  return firstString(filter) === 'descuento' ? 'descuento' : undefined;
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

/**
 * Filters by tag, but treats a tag that NOTHING in the catalog carries as
 * "no filter" rather than as a filter matching zero products.
 *
 * This is what keeps the nav's "Ideas para regalar" link (/catalogo?tag=regalo)
 * honest before the gift-curation system exists: the moment a product is tagged
 * `regalo` the link narrows to it, and until then it shows the full catalog
 * instead of an empty state the visitor can't act on. A tag that DOES exist but
 * happens to match nothing right now still filters to empty — that is a real
 * result, not a dangling link.
 */
export function filterProductsByTag(products: Product[], tagSlug?: string) {
  if (!tagSlug) return products;

  const tagExists = products.some((product) =>
    product.tags.some((tag) => tag.slug === tagSlug),
  );
  if (!tagExists) return products;

  return products.filter((product) =>
    product.tags.some((tag) => tag.slug === tagSlug),
  );
}

/** Narrows to products currently showing a sale price. See `hasActiveSalePrice`. */
export function filterProductsByDiscount(
  products: Product[],
  filter?: CatalogFilter,
) {
  if (filter !== 'descuento') return products;
  return products.filter(hasActiveSalePrice);
}

/**
 * `sort=nuevo` is a no-op by design: productRepository.getAll already returns
 * `createdAt: 'desc'`, so newest-first IS the incoming order. The param is
 * still parsed and threaded through so Phase 3's sidebar has something to
 * reflect, and so adding a second sort mode later has an obvious home.
 */
export function sortProducts(products: Product[], sort?: CatalogSort) {
  if (sort !== 'nuevo') return products;
  return products;
}

/** Single entry point: applies tag, discount and sort in that order. */
export function applyCatalogParams(
  products: Product[],
  {
    tagSlug,
    filter,
    sort,
  }: { tagSlug?: string; filter?: CatalogFilter; sort?: CatalogSort },
) {
  return sortProducts(
    filterProductsByDiscount(filterProductsByTag(products, tagSlug), filter),
    sort,
  );
}
