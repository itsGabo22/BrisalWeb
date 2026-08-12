/**
 * Prisma model → client-facing type mappers.
 * Converts Prisma's Decimal fields to plain numbers before data crosses
 * the server/client boundary (see src/types/index.ts).
 */
import type {
  Category as PrismaCategory,
  ColorVariant as PrismaColorVariant,
  Coupon as PrismaCoupon,
  Discount as PrismaDiscount,
  Material as PrismaMaterial,
  Product as PrismaProduct,
  ProductTag,
  Tag as PrismaTag,
} from '@prisma/client';
import type {
  Category,
  ColorVariant,
  Coupon,
  Discount,
  Material,
  Product,
  Tag,
} from '@/types';

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

export function toMaterial(material: PrismaMaterial): Material {
  return {
    id: material.id,
    name: material.name,
    slug: material.slug,
  };
}

export function toDiscount(
  discount: PrismaDiscount & { products?: { id: string }[] },
): Discount {
  return {
    id: discount.id,
    label: discount.label,
    percentage: discount.percentage.toNumber(),
    scope: discount.scope,
    categoryId: discount.categoryId,
    productId: discount.productId,
    // Absent relation reads as "not loaded", which for every storefront caller
    // is the same as "not needed" — only the admin form asks for it.
    productIds: (discount.products ?? []).map((product) => product.id),
    couponCode: discount.code,
    startsAt: discount.startsAt?.toISOString() ?? null,
    endsAt: discount.endsAt?.toISOString() ?? null,
    active: discount.active,
  };
}

export function toCoupon(coupon: PrismaCoupon): Coupon {
  return {
    id: coupon.id,
    code: coupon.code,
    percentage: coupon.percentage.toNumber(),
    active: coupon.active,
    startsAt: coupon.startsAt?.toISOString() ?? null,
    endsAt: coupon.endsAt?.toISOString() ?? null,
    usageLimit: coupon.usageLimit,
    usageCount: coupon.usageCount,
    createdAt: coupon.createdAt.toISOString(),
  };
}

type ProductWithRelations = PrismaProduct & {
  category: PrismaCategory;
  tags: (ProductTag & { tag: PrismaTag })[];
  /** PRODUCT-scoped discounts via the join table, plus whatever
   *  `attachScopedDiscounts` merged in. Named for the relation it comes from;
   *  it becomes plain `discounts` on the client type. */
  appliedDiscounts: PrismaDiscount[];
  colorVariants?: PrismaColorVariant[];
  materials?: PrismaMaterial[];
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
    colorName: product.colorName,
    colorHex: product.colorHex,
    imageUrls: product.imageUrls,
    featured: product.featured,
    active: product.active,
    categoryId: product.categoryId,
    category: toCategory(product.category),
    tags: product.tags.map((productTag) => toTag(productTag.tag)),
    // Alphabetical so a product's materials read the same everywhere — the
    // implicit m2m table has no ordering column to rely on.
    materials: (product.materials ?? [])
      .map(toMaterial)
      .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    discounts: product.appliedDiscounts.map(toDiscount),
    // Sorted here rather than relying on every caller's include to specify an
    // orderBy, so the product page's "first variant" default is deterministic.
    colorVariants: (product.colorVariants ?? [])
      .map(toColorVariant)
      .sort((a, b) => a.order - b.order),
    createdAt: product.createdAt.toISOString(),
  };
}

export function toColorVariant(variant: PrismaColorVariant): ColorVariant {
  return {
    id: variant.id,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    imageUrls: variant.imageUrls,
    // Decimal -> number, preserving null as "inherit the product price".
    price: variant.price ? variant.price.toNumber() : null,
    wholesalePrice: variant.wholesalePrice
      ? variant.wholesalePrice.toNumber()
      : null,
    stock: variant.stock,
    order: variant.order,
  };
}
