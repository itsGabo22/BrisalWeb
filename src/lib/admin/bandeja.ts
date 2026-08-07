import { prisma } from '@/lib/prisma';

/**
 * Reconciles which bandeja images a product is using.
 *
 * Done server-side, from the product's FINAL image set, rather than by the
 * form posting a list of "pending assignments". That client-side approach only
 * ever covered the product's primary images — variant images were never marked
 * used, so they kept reappearing in the available pool — and it had no path at
 * all for freeing an image removed from an already-saved product.
 *
 * Two directions, both required:
 *   • every bandeja row whose url the product now uses  → assigned to it
 *   • every row still pointing at this product that it no longer uses → freed
 *
 * Matching is by URL because that is the only link between an ImageBandeja row
 * and the string arrays on Product/ColorVariant.
 */
export async function reconcileBandejaAssignments(
  productId: string,
  usedUrls: string[],
): Promise<void> {
  const urls = [...new Set(usedUrls.filter(Boolean))];

  // Free anything previously assigned here that has since been removed.
  await prisma.imageBandeja.updateMany({
    where: {
      productId,
      ...(urls.length > 0 ? { url: { notIn: urls } } : {}),
    },
    data: { productId: null, assigned: false },
  });

  if (urls.length === 0) return;

  // Claim everything the product now uses. Rows already pointing here are
  // rewritten with the same values, which is harmless and keeps this a single
  // statement.
  await prisma.imageBandeja.updateMany({
    where: { url: { in: urls } },
    data: { productId, assigned: true },
  });
}

/** Every image URL a product occupies: its primary images plus each colour's. */
export function collectProductImageUrls(product: {
  imageUrls: string[];
  colorVariants: { imageUrls: string[] }[];
}): string[] {
  return [
    ...product.imageUrls,
    ...product.colorVariants.flatMap((variant) => variant.imageUrls),
  ];
}
