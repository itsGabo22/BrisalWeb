/**
 * Product repository - interface + Prisma implementation.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Product } from '@/types';
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
  search(query: string): Promise<Product[]>;
  getRelated(product: Product, limit?: number): Promise<Product[]>;
}

export const PRODUCT_INCLUDE = {
  category: true,
  tags: { include: { tag: true } },
  discounts: true,
} satisfies Prisma.ProductInclude;

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

    return products.map(toProduct);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });

    return product ? toProduct(product) : null;
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

    return products.map(toProduct);
  }

  async search(query: string): Promise<Product[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { description: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return products.map(toProduct);
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

    return related.map(toProduct);
  }
}

export const productRepository: IProductRepository =
  new PrismaProductRepository();
