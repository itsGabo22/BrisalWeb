/**
 * The one place that flattens a product's PRIMARY colour and its additional
 * ColorVariant rows into a single ordered list of selectable colours.
 *
 * The model, so it doesn't have to be re-derived at each call site:
 *   • The primary colour belongs to the PRODUCT. `Product.imageUrls`,
 *     `price`, `wholesalePrice`, `stock` and `sku` ARE the primary colour's —
 *     a single-colour product therefore needs no variant and enters its stock
 *     exactly once.
 *   • ColorVariant rows are ADDITIONAL colours layered on top, each with its
 *     own images and stock and optionally its own price.
 *   • A product with a primary colour and two variants offers three colours:
 *     primary first, then the variants in their `order`.
 */
import type { ColorVariant, Product } from '@/types';
import { getProductReference, getVariantReference } from './product-reference';

/** Sentinel id for the primary colour, which has no ColorVariant row. */
export const PRIMARY_COLOR_ID = 'primary';

export interface SelectableColor {
  /** `PRIMARY_COLOR_ID`, or the variant's id. */
  id: string;
  isPrimary: boolean;
  colorName: string;
  colorHex: string;
  imageUrls: string[];
  /** Already resolved — a variant with no price of its own inherits here. */
  price: number;
  wholesalePrice: number | null;
  stock: number;
  reference: string;
  /** The variant row, or null for the primary colour. */
  variant: ColorVariant | null;
}

/** True when the product carries a usable primary colour of its own. */
export function hasPrimaryColor(
  product: Pick<Product, 'colorName'>,
): boolean {
  return Boolean(product.colorName?.trim());
}

/**
 * Every colour a shopper can pick, primary first.
 *
 * A product with no primary colour and no variants yields an empty list, which
 * is what keeps a plain product free of any colour UI.
 */
export function getSelectableColors(product: Product): SelectableColor[] {
  const colors: SelectableColor[] = [];

  if (hasPrimaryColor(product)) {
    colors.push({
      id: PRIMARY_COLOR_ID,
      isPrimary: true,
      colorName: product.colorName!.trim(),
      colorHex: product.colorHex?.trim() || '#E5DDD2',
      imageUrls: product.imageUrls,
      price: product.price,
      wholesalePrice: product.wholesalePrice ?? null,
      stock: product.stock,
      reference: getProductReference(product),
      variant: null,
    });
  }

  for (const variant of product.colorVariants) {
    colors.push({
      id: variant.id,
      isPrimary: false,
      colorName: variant.colorName.trim(),
      colorHex: variant.colorHex?.trim() || '#E5DDD2',
      // Falls back to the product's images when a colour has none of its own,
      // so a half-finished variant never shows an empty gallery.
      imageUrls: variant.imageUrls.length > 0 ? variant.imageUrls : product.imageUrls,
      price: variant.price ?? product.price,
      wholesalePrice: variant.wholesalePrice ?? product.wholesalePrice ?? null,
      stock: variant.stock,
      reference: getVariantReference(product, variant),
      variant,
    });
  }

  return colors;
}

/**
 * Total units across every colour a product sells in.
 *
 * `product.stock` alone is only the PRIMARY colour's — a product whose primary
 * colour is sold out but which still has stock in two variants is not
 * "Agotado", and saying so would pull a sellable piece out of the listing.
 *
 * Lifted out of the admin product list, which is where this rule was written:
 * the storefront now blocks ordering on the same judgement, and the two must
 * not be able to disagree about whether a product is sellable.
 */
export function getTotalStock(product: Product): number {
  const colors = getSelectableColors(product);
  // A product with no colour data at all keeps its own stock as the total.
  if (colors.length === 0) return product.stock;
  return colors.reduce((sum, color) => sum + Math.max(0, color.stock), 0);
}

/**
 * True when NO colour of this product can be bought — the card-level "Agotado".
 *
 * Deliberately all-colours rather than primary-only: labelling a product
 * Agotado while a different finish of it is still purchasable would talk a
 * shopper out of a sale the client can actually fulfil.
 */
export function isProductSoldOut(product: Product): boolean {
  return getTotalStock(product) <= 0;
}

/**
 * Stock of the colour the CARD represents — the primary one, which is what
 * quick-add puts in the cart. Falls back to the product's own column for a
 * product with no colour data, exactly as `getSelectableColors` does.
 */
export function getPrimaryStock(product: Product): number {
  return Math.max(0, product.stock);
}

/**
 * The distinct colour NAMES a product is available in — primary included.
 *
 * This is what the catalog filter reads, and including the primary is what
 * makes a single-colour product (no variants at all) appear when filtering by
 * its colour.
 */
export function getProductColorNames(product: Product): string[] {
  const names = new Set<string>();
  if (hasPrimaryColor(product)) names.add(product.colorName!.trim());
  for (const variant of product.colorVariants) {
    const name = variant.colorName.trim();
    if (name) names.add(name);
  }
  return [...names];
}
