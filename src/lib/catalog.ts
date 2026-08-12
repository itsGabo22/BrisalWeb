import type { Category, Product, Tag } from '@/types';
import { hasActiveSalePrice } from '@/lib/utils/pricing';
import { getColorFacets, productMatchesColors, type ColorFacet } from '@/lib/utils/product-colors';

export type { ColorFacet };

export const PAGE_SIZE = 24;

export type CatalogSearchParams = Promise<{
  tag?: string | string[];
  sort?: string | string[];
  filter?: string | string[];
  categoria?: string | string[];
  color?: string | string[];
  material?: string | string[];
  precioMin?: string | string[];
  precioMax?: string | string[];
  page?: string | string[];
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

/** Reads a comma-separated multi-select param into a deduped slug list. */
function slugList(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
}

function positiveNumber(value: string | string[] | undefined): number | undefined {
  const raw = firstString(value);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
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

/** Every filter dimension the catalog understands, already normalized. */
export interface CatalogQuery {
  tagSlug?: string;
  sort?: CatalogSort;
  filter?: CatalogFilter;
  categorySlugs: string[];
  colorSlugs: string[];
  materialSlugs: string[];
  priceMin?: number;
  priceMax?: number;
  page: number;
}

export function parseCatalogQuery(
  params: Awaited<CatalogSearchParams>,
): CatalogQuery {
  const page = positiveNumber(params.page);
  return {
    tagSlug: normalizeTagParam(params.tag),
    sort: normalizeSortParam(params.sort),
    filter: normalizeFilterParam(params.filter),
    categorySlugs: slugList(params.categoria),
    colorSlugs: slugList(params.color),
    materialSlugs: slugList(params.material),
    priceMin: positiveNumber(params.precioMin),
    priceMax: positiveNumber(params.precioMax),
    page: page && page >= 1 ? Math.floor(page) : 1,
  };
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
  // Wrapped, not passed by reference: `hasActiveSalePrice` takes an optional
  // `now` second argument and `Array.filter` would hand it the array index.
  // One evaluation instant for the whole pass, so a discount cannot expire
  // midway through and split the results.
  const now = new Date();
  return products.filter((product) => hasActiveSalePrice(product, now));
}

/**
 * `sort=nuevo` is a no-op by design: productRepository.getAll already returns
 * `createdAt: 'desc'`, so newest-first IS the incoming order. The param is
 * still parsed and threaded through so the sidebar has something to reflect,
 * and so adding a second sort mode later has an obvious home.
 */
export function sortProducts(products: Product[], sort?: CatalogSort) {
  if (sort !== 'nuevo') return products;
  return products;
}

/**
 * Expands a selection of category slugs to include every descendant slug.
 *
 * Selecting "Aretes" has to match products filed under "Aretes argolla":
 * almost everything in this catalog hangs off a SUBcategory, so matching the
 * product's own slug alone would make every root category read as empty. The
 * expansion happens here, against the tree, so the matching itself stays a
 * plain set membership test with no shared state to get stale.
 */
export function expandCategorySlugs(
  categories: Category[],
  selected: string[],
): string[] {
  if (selected.length === 0) return [];
  const wanted = new Set(selected);
  const expanded = new Set(selected);

  for (const root of categories) {
    if (!wanted.has(root.slug)) continue;
    for (const child of root.children ?? []) {
      expanded.add(child.slug);
    }
  }

  return [...expanded];
}

function productMatchesCategories(product: Product, expandedSlugs: string[]): boolean {
  if (expandedSlugs.length === 0) return true;
  return expandedSlugs.includes(product.category.slug);
}

export interface CategoryFacet {
  id: string;
  slug: string;
  name: string;
  count: number;
  children: CategoryFacet[];
}

/**
 * Category list with counts, rolled UP the tree: a root's count includes
 * everything in its children, which is what makes "ARETES (5)" meaningful when
 * every actual product hangs off "Aretes argolla".
 *
 * Counts are computed over the products passed in — i.e. the page's full
 * scope before filtering — so the numbers stay stable as the shopper ticks
 * boxes instead of collapsing to zero.
 */
export function buildCategoryFacets(
  categories: Category[],
  products: Product[],
): CategoryFacet[] {
  const directCounts = new Map<string, number>();
  for (const product of products) {
    const slug = product.category.slug;
    directCounts.set(slug, (directCounts.get(slug) ?? 0) + 1);
  }

  return categories
    .map((root) => {
      const children = (root.children ?? []).map((child) => ({
        id: child.id,
        slug: child.slug,
        name: child.name,
        count: directCounts.get(child.slug) ?? 0,
        children: [],
      }));

      const count =
        (directCounts.get(root.slug) ?? 0) +
        children.reduce((sum, child) => sum + child.count, 0);

      return { id: root.id, slug: root.slug, name: root.name, count, children };
    })
    // An empty category is not an offer. Ticking "Belleza (0)" could only ever
    // produce the empty state, so it is left out rather than shown greyed.
    .filter((facet) => facet.count > 0);
}

export interface MaterialFacet {
  id: string;
  slug: string;
  name: string;
  count: number;
}

/**
 * Materials present in the given products, with counts.
 *
 * Derived from the products rather than read from the Material table so the
 * sidebar can only ever offer a material something in scope actually has —
 * "Oro laminado (0)" on a page with no gold-plated pieces is a dead end. A
 * product with several materials counts once toward each, which is why the
 * counts can sum to more than the catalog size.
 */
export function buildMaterialFacets(products: Product[]): MaterialFacet[] {
  const facets = new Map<string, MaterialFacet>();

  for (const product of products) {
    for (const material of product.materials) {
      const existing = facets.get(material.slug);
      if (existing) existing.count += 1;
      else
        facets.set(material.slug, {
          id: material.id,
          slug: material.slug,
          name: material.name,
          count: 1,
        });
    }
  }

  return [...facets.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function productMatchesMaterials(product: Product, slugs: string[]): boolean {
  if (slugs.length === 0) return true;
  // OR within the type: a product matches if it has ANY selected material.
  return product.materials.some((material) => slugs.includes(material.slug));
}

export interface PriceBounds {
  min: number;
  max: number;
}

/** Slider bounds from real data. Returns null when there is nothing to bound. */
export function getPriceBounds(products: Product[]): PriceBounds | null {
  if (products.length === 0) return null;
  const prices = products.map((p) => p.price);
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  // A single-priced catalog would give a zero-width slider; widen it so the
  // handles remain draggable.
  return min === max ? { min: Math.max(0, min - 1), max: max + 1 } : { min, max };
}

export function buildColorFacets(products: Product[]): ColorFacet[] {
  return getColorFacets(products);
}

function filterProductsByPrice(
  products: Product[],
  min?: number,
  max?: number,
): Product[] {
  if (min === undefined && max === undefined) return products;
  return products.filter(
    (p) => (min === undefined || p.price >= min) && (max === undefined || p.price <= max),
  );
}

/**
 * Applies every dimension. AND across filter TYPES, OR within a type —
 * (aretes OR collares) AND (negro) AND price-range.
 *
 * `categories` is needed to expand a selected root into its subcategories;
 * pass the same tree the facets were built from.
 */
export function applyCatalogParams(
  products: Product[],
  query: Pick<
    CatalogQuery,
    | 'tagSlug'
    | 'filter'
    | 'sort'
    | 'categorySlugs'
    | 'colorSlugs'
    | 'materialSlugs'
    | 'priceMin'
    | 'priceMax'
  >,
  categories: Category[] = [],
): Product[] {
  const expanded = expandCategorySlugs(categories, query.categorySlugs);

  /**
   * Same rule as the tag filter: a colour slug that NOTHING in the catalog
   * carries is treated as no filter rather than as a filter matching zero.
   *
   * Today that means every `?color=` lands on the full catalog, because no
   * product has colour data at all. Once Phase 4 populates colours, a slug the
   * shopper picked from the sidebar always exists (the facets are derived from
   * the products), so it filters properly — and only stale or hand-typed URLs
   * fall back. Without this, `?color=negro` is a dead end nothing in the UI
   * can explain.
   */
  const availableColors = new Set(buildColorFacets(products).map((c) => c.slug));
  const effectiveColors = query.colorSlugs.filter((slug) => availableColors.has(slug));

  /**
   * Materials get the same treatment, and for the same reason: a slug picked
   * from the sidebar always exists (the facets come from these products), so
   * only a stale or hand-typed `?material=` can miss — and that should show the
   * catalog rather than an empty grid the shopper has no way to explain.
   */
  const availableMaterials = new Set(buildMaterialFacets(products).map((m) => m.slug));
  const effectiveMaterials = query.materialSlugs.filter((slug) =>
    availableMaterials.has(slug),
  );

  let result = filterProductsByTag(products, query.tagSlug);
  result = filterProductsByDiscount(result, query.filter);
  result = result.filter((p) => productMatchesCategories(p, expanded));
  result = result.filter((p) => productMatchesColors(p, effectiveColors));
  result = result.filter((p) => productMatchesMaterials(p, effectiveMaterials));
  result = filterProductsByPrice(result, query.priceMin, query.priceMax);
  return sortProducts(result, query.sort);
}

export interface PaginatedProducts {
  items: Product[];
  page: number;
  totalPages: number;
  total: number;
}

/**
 * Clamps out-of-range pages rather than showing an empty grid — landing on
 * ?page=9 after filters cut the results to one page should show that page.
 */
export function paginateProducts(products: Product[], page: number): PaginatedProducts {
  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * PAGE_SIZE;

  return {
    items: products.slice(start, start + PAGE_SIZE),
    page: current,
    totalPages,
    total,
  };
}
