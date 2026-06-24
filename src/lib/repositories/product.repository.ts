/**
 * Product repository - interface + mock implementation.
 *
 * The method signatures are intentionally identical to what the real Prisma
 * implementation will expose (Fase 3: product.repository.prisma.ts).
 * Switching from mock to real only requires changing the exported singleton.
 */
import type { Product } from '@/types';
import { ALL_CATEGORIES, MOCK_PRODUCTS } from './mock-data';

const MOCK_CATEGORIES = ALL_CATEGORIES;

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
}

class MockProductRepository implements IProductRepository {
  async getAll(options: GetAllProductsOptions = {}): Promise<Product[]> {
    let results = [...MOCK_PRODUCTS];

    const activeFilter = options.active ?? true;
    results = results.filter((product) => product.active === activeFilter);

    if (options.subcategorySlug) {
      results = results.filter(
        (product) =>
          product.category.slug === options.subcategorySlug &&
          product.category.parentId != null,
      );
    } else if (options.categorySlug) {
      const category = MOCK_CATEGORIES.find(
        (category) => category.slug === options.categorySlug,
      );

      results = results.filter(
        (product) =>
          product.category.slug === options.categorySlug ||
          (category ? product.category.parentId === category.id : false),
      );
    }

    if (options.tagSlug) {
      results = results.filter((product) =>
        product.tags.some((tag) => tag.slug === options.tagSlug),
      );
    }

    if (options.featured !== undefined) {
      results = results.filter(
        (product) => product.featured === options.featured,
      );
    }

    return results;
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return MOCK_PRODUCTS.find((product) => product.slug === slug) ?? null;
  }

  async getFeatured(tagSlug?: string): Promise<Product[]> {
    let results = MOCK_PRODUCTS.filter(
      (product) => product.featured && product.active,
    );

    if (tagSlug) {
      results = results.filter((product) =>
        product.tags.some((tag) => tag.slug === tagSlug),
      );
    }

    return results;
  }
}

export const productRepository: IProductRepository =
  new MockProductRepository();
