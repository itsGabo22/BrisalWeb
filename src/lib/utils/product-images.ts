export const PRODUCT_IMAGE_PLACEHOLDER = '/images/products/placeholder.svg';

export function resolveProductImageUrl(url?: string | null): string {
  if (!url || url.trim() === '') {
    return PRODUCT_IMAGE_PLACEHOLDER;
  }

  return url;
}
