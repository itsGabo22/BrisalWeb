export const PRODUCT_IMAGE_PLACEHOLDER = '/images/products/placeholder.svg';

/**
 * The image to show for a product in a listing.
 *
 * ── The base-product vs variants rule ────────────────────────────────────
 * When a product has colour variants, THE VARIANTS ARE ITS COLOURS. There is
 * no separate "base colour". `Product.imageUrls` is a FALLBACK only:
 *
 *   1. the first variant's first image  — the product's face in the catalog
 *   2. any later variant's first image  — if the first variant has none yet
 *   3. `Product.imageUrls[0]`           — if no variant has any image
 *   4. the placeholder                  — if there is nothing at all
 *
 * Falling through 2 matters because the admin lets a colour be saved before
 * its photos are uploaded, and the catalog card must never come out blank
 * just because the FIRST colour is the unfinished one.
 */
export function resolveListingImageUrl(product: {
  imageUrls: string[];
  colorVariants: { imageUrls: string[] }[];
}): string {
  const fromVariant = product.colorVariants.find(
    (variant) => variant.imageUrls.length > 0,
  )?.imageUrls[0];

  return resolveProductImageUrl(fromVariant ?? product.imageUrls[0]);
}

export function resolveProductImageUrl(url?: string | null): string {
  if (!url || url.trim() === '') {
    return PRODUCT_IMAGE_PLACEHOLDER;
  }

  return url;
}
