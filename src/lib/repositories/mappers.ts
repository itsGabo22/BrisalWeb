/**
 * Prisma model → client-facing type mappers.
 * Converts Prisma's Decimal fields to plain numbers before data crosses
 * the server/client boundary (see src/types/index.ts).
 */
import type {
  Category as PrismaCategory,
  Discount as PrismaDiscount,
  Product as PrismaProduct,
  ProductTag,
  Tag as PrismaTag,
} from '@prisma/client';
import type { Category, Discount, Product, Tag } from '@/types';

export function toCategory(
  category: PrismaCategory & { children?: PrismaCategory[] },
): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    parentId: category.parentId,
    children: category.children?.map((child) => toCategory(child)),
  };
}

export function toTag(tag: PrismaTag): Tag {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

export function toDiscount(discount: PrismaDiscount): Discount {
  return {
    id: discount.id,
    label: discount.label,
    percentage: discount.percentage.toNumber(),
    scope: discount.scope,
    categoryId: discount.categoryId,
    productId: discount.productId,
    couponCode: discount.code,
    startsAt: discount.startsAt,
    endsAt: discount.endsAt,
    active: discount.active,
  };
}

type ProductWithRelations = PrismaProduct & {
  category: PrismaCategory;
  tags: (ProductTag & { tag: PrismaTag })[];
  discounts: PrismaDiscount[];
};

export function toProduct(product: ProductWithRelations): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toNumber(),
    comparePrice: product.comparePrice ? product.comparePrice.toNumber() : null,
    wholesalePrice: product.wholesalePrice
      ? product.wholesalePrice.toNumber()
      : null,
    sku: product.sku,
    stock: product.stock,
    material: product.material,
    imageUrls: product.imageUrls,
    featured: product.featured,
    active: product.active,
    categoryId: product.categoryId,
    category: toCategory(product.category),
    tags: product.tags.map((productTag) => toTag(productTag.tag)),
    discounts: product.discounts.map(toDiscount),
  };
}
