/**
 * Product repository — interface + mock implementation.
 *
 * The method signatures are intentionally identical to what the real Prisma
 * implementation will expose (Fase 3: product.repository.prisma.ts).
 * Switching from mock → real only requires changing the exported singleton.
 */
import type { Product } from '@/types';
import {
  MOCK_PRODUCTS,
  CAT_ACERO,
  CAT_RODIO,
} from './mock-data';

// ─── Options ──────────────────────────────────────────────────────────────────
export interface GetAllProductsOptions {
  categorySlug?: string;
  subcategorySlug?: string;
  tagSlug?: string;
  featured?: boolean;
  active?: boolean;
}

// ─── Interface ────────────────────────────────────────────────────────────────
export interface IProductRepository {
  getAll(options?: GetAllProductsOptions): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  getFeatured(tagSlug?: string): Promise<Product[]>;
}

// ─── Mock implementation ──────────────────────────────────────────────────────
class MockProductRepository implements IProductRepository {
  async getAll(options: GetAllProductsOptions = {}): Promise<Product[]> {
    let results = [...MOCK_PRODUCTS];

    // Filter by active (defaults to showing only active products)
    const activeFilter = options.active ?? true;
    results = results.filter((p) => p.active === activeFilter);

    // Subcategory takes precedence over category for narrower filtering
    if (options.subcategorySlug) {
      const target =
        options.subcategorySlug === CAT_ACERO.slug
          ? CAT_ACERO
          : options.subcategorySlug === CAT_RODIO.slug
          ? CAT_RODIO
          : null;
      if (target) {
        results = results.filter((p) => p.categoryId === target.id);
      }
    } else if (options.categorySlug) {
      // Parent category slug → return products from all child categories
      results = results.filter(
        (p) =>
          p.category.slug === options.categorySlug ||
          p.category.parentId != null,
      );
    }

    if (options.tagSlug) {
      results = results.filter((p) =>
        p.tags.some((t) => t.slug === options.tagSlug),
      );
    }

    if (options.featured !== undefined) {
      results = results.filter((p) => p.featured === options.featured);
    }

    return results;
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  async getFeatured(tagSlug?: string): Promise<Product[]> {
    let results = MOCK_PRODUCTS.filter((p) => p.featured && p.active);
    if (tagSlug) {
      results = results.filter((p) => p.tags.some((t) => t.slug === tagSlug));
    }
    return results;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const productRepository: IProductRepository = new MockProductRepository();
