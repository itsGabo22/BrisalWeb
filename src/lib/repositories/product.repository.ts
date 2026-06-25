/**
 * Product repository - interface + mock implementation using adminStore.
 */
import type { Product } from '@/types';
import { productStore, categoryStore } from '@/lib/stores/adminStore';

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
    let results = [...productStore.getAll()];

    const activeFilter = options.active ?? true;
    results = results.filter((product) => product.active === activeFilter);

    if (options.subcategorySlug) {
      results = results.filter(
        (product) =>
          product.category.slug === options.subcategorySlug &&
          product.category.parentId != null,
      );
    } else if (options.categorySlug) {
      const category = categoryStore.getAll().find(
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
    return productStore.getBySlug(slug);
  }

  async getFeatured(tagSlug?: string): Promise<Product[]> {
    let results = productStore.getAll().filter(
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
