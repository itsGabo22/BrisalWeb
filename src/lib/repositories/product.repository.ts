/**
 * Product repository - interface + Prisma implementation.
 */
import type { Prisma, Discount as PrismaDiscount } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Product } from '@/types';
import { getRatingSummaries } from '@/lib/reviews';
import { findRankedProductIds } from '@/lib/search/product-search';
import { toProduct } from './mappers';

export interface GetAllProductsOptions {
  categorySlug?: string;
  subcategorySlug?: string;
  tagSlug?: string;
  featured?: boolean;
  active?: boolean;
}

export interface IProductRepository {
  getAll(options?: GetAllProductsOptions): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getFeatured(tagSlug?: string): Promise<Product[]>;
  /**
   * Products by id, with discounts and ratings attached like every other read.
   *
   * Exists for the server-side price quote, which is handed cart lines and has
   * to price them from the database rather than from what the client posted.
   * Missing ids are simply absent from the result — a product deleted since the
   * cart was filled is the caller's problem to report, not this method's.
   */
  getByIds(ids: string[]): Promise<Product[]>;
  search(query: string): Promise<Product[]>;
  searchPreview(
    query: string,
    limit: number,
  ): Promise<{ products: Product[]; total: number }>;
  getRelated(product: Product, limit?: number): Promise<Product[]>;
}

export const PRODUCT_INCLUDE = {
  category: true,
  tags: { include: { tag: true } },
  // The many-to-many, so it only ever yields PRODUCT-scoped rows. GLOBAL and
  // CATEGORY discounts have no product links and can never arrive this way —
  // `attachScopedDiscounts` below is what merges them in.
  //
  // This replaced the old `discounts: true`, which followed the single-product
  // `Discount.productId` foreign key and so capped a campaign at one product.
  appliedDiscounts: true,
  colorVariants: { orderBy: { order: 'asc' } },
  materials: true,
} satisfies Prisma.ProductInclude;

/**
 * Merges GLOBAL and CATEGORY discounts onto products.
 *
 * Without this, a discount created in the admin with either of those scopes is
 * written correctly and then never reaches a single product, because the only
 * link Prisma can follow is the per-product foreign key. The admin offers all
 * three scopes, so two of them were silently inert.
 *
 * A CATEGORY discount matches a product filed directly in that category AND
 * one filed in a child of it — most products here hang off a subcategory
 * ("Aretes argolla", not "Aretes"), so matching only the exact id would make
 * category discounts miss nearly everything.
 *
 * One extra query per fetch, regardless of how many products came back.
 */
async function attachScopedDiscounts<
  T extends {
    categoryId: string;
    category: { parentId: string | null };
    appliedDiscounts: PrismaDiscount[];
  },
>(products: T[]): Promise<T[]> {
  if (products.length === 0) return products;

  const scoped = await prisma.discount.findMany({
    where: { active: true, scope: { in: ['GLOBAL', 'CATEGORY'] } },
  });
  if (scoped.length === 0) return products;

  const globals = scoped.filter((discount) => discount.scope === 'GLOBAL');
  const byCategory = new Map<string, PrismaDiscount[]>();
  for (const discount of scoped) {
    if (discount.scope !== 'CATEGORY' || !discount.categoryId) continue;
    const existing = byCategory.get(discount.categoryId);
    if (existing) existing.push(discount);
    else byCategory.set(discount.categoryId, [discount]);
  }

  return products.map((product) => {
    const own = byCategory.get(product.categoryId) ?? [];
    const parentId = product.category.parentId;
    const inherited = parentId ? (byCategory.get(parentId) ?? []) : [];

    if (globals.length === 0 && own.length === 0 && inherited.length === 0) {
      return product;
    }
    return {
      ...product,
      appliedDiscounts: [...product.appliedDiscounts, ...globals, ...own, ...inherited],
    };
  });
}

/**
 * The single exit path from every repository read: merge the scoped discounts,
 * attach the APPROVED-review rating aggregate, then map to the client type.
 *
 * Both extras cost exactly one query each for the whole batch, no matter how
 * many products came back — a per-card rating query would have been N+1 on a
 * 40-product catalog page. Products with no approved reviews get no `rating`
 * at all, which is what lets a card render nothing rather than five grey stars.
 */
async function finalize(
  products: Parameters<typeof toProduct>[0][],
): Promise<Product[]> {
  const [withDiscounts, ratings] = await Promise.all([
    attachScopedDiscounts(products),
    getRatingSummaries(products.map((product) => product.id)),
  ]);

  return withDiscounts.map((product) => {
    const mapped = toProduct(product);
    const rating = ratings.get(product.id);
    return rating ? { ...mapped, rating } : mapped;
  });
}

/**
 * Loads products for an already-ranked list of ids, preserving that order.
 *
 * `WHERE id IN (...)` returns rows in whatever order the planner likes, which
 * would throw away the relevance ranking the search query just computed — so
 * the rows are re-sorted against the id list before `finalize` maps them. The
 * sort happens BEFORE finalize because finalize preserves input order, and
 * doing it after would mean re-sorting the mapped type instead.
 */
async function hydrateRanked(rankedIds: string[]): Promise<Product[]> {
  if (rankedIds.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: rankedIds } },
    include: PRODUCT_INCLUDE,
  });

  const rank = new Map(rankedIds.map((id, index) => [id, index]));
  rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

  return finalize(rows);
}

class PrismaProductRepository implements IProductRepository {
  async getAll(options: GetAllProductsOptions = {}): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
      active: options.active ?? true,
    };

    if (options.subcategorySlug) {
      where.category = {
        slug: options.subcategorySlug,
        parentId: { not: null },
      };
    } else if (options.categorySlug) {
      where.category = {
        OR: [
          { slug: options.categorySlug },
          { parent: { slug: options.categorySlug } },
        ],
      };
    }

    if (options.tagSlug) {
      where.tags = { some: { tag: { slug: options.tagSlug } } };
    }

    if (options.featured !== undefined) {
      where.featured = options.featured;
    }

    const products = await prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return finalize(products);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });

    if (!product) return null;
    const [finalized] = await finalize([product]);
    return finalized;
  }

  async getByIds(ids: string[]): Promise<Product[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];

    /**
     * No `active: true` filter, deliberately. A line already sitting in
     * someone's cart for a product the admin has since deactivated still has to
     * be PRICED — refusing to price it here would surface as a mysterious zero
     * rather than as the clear "ya no está disponible" the order route gives.
     */
    const products = await prisma.product.findMany({
      where: { id: { in: unique } },
      include: PRODUCT_INCLUDE,
    });

    return finalize(products);
  }

  async getFeatured(tagSlug?: string): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = { featured: true, active: true };

    if (tagSlug) {
      where.tags = { some: { tag: { slug: tagSlug } } };
    }

    const products = await prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return finalize(products);
  }

  /**
   * A capped search for the type-ahead endpoint.
   *
   * `search` deliberately returns everything, because the full results page
   * wants it. The preview box wants six — and fetching the whole matching set
   * with every relation only to slice six off in the route handler is the same
   * query cost as the full page on an endpoint anonymous callers can hit as
   * fast as they can type.
   *
   * `total` is the length of the ranked id list rather than a second COUNT
   * query. The ranking pass has to evaluate every candidate row to order them
   * anyway, so it already knows the figure — and it returns ids only, which is
   * what keeps that cheap. The expensive part, loading relations, is still
   * capped at `limit`.
   */
  async searchPreview(
    query: string,
    limit: number,
  ): Promise<{ products: Product[]; total: number }> {
    const rankedIds = await findRankedProductIds(query);
    if (rankedIds.length === 0) return { products: [], total: 0 };

    return {
      products: await hydrateRanked(rankedIds.slice(0, limit)),
      total: rankedIds.length,
    };
  }

  async search(query: string): Promise<Product[]> {
    const rankedIds = await findRankedProductIds(query);
    if (rankedIds.length === 0) return [];

    return hydrateRanked(rankedIds);
  }

  /** Same category first, then fills remaining slots with same-tag products. */
  async getRelated(product: Product, limit = 4): Promise<Product[]> {
    const sameCategory = await prisma.product.findMany({
      where: { id: { not: product.id }, active: true, categoryId: product.categoryId },
      include: PRODUCT_INCLUDE,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const related = [...sameCategory];
    const tagIds = product.tags.map((tag) => tag.id);

    if (related.length < limit && tagIds.length > 0) {
      const excludeIds = [product.id, ...related.map((p) => p.id)];
      const sameTag = await prisma.product.findMany({
        where: {
          id: { notIn: excludeIds },
          active: true,
          tags: { some: { tagId: { in: tagIds } } },
        },
        include: PRODUCT_INCLUDE,
        take: limit - related.length,
        orderBy: { createdAt: 'desc' },
      });
      related.push(...sameTag);
    }

    return finalize(related);
  }
}

export const productRepository: IProductRepository =
  new PrismaProductRepository();
