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
}

const PRODUCT_INCLUDE = {
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
}

export const productRepository: IProductRepository =
  new PrismaProductRepository();
