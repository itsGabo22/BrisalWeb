'use client';

import * as React from 'react';

import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import type { ColorVariant, Product } from '@/types';

export interface ProductDetailProps {
  product: Product;
}

/**
 * Owns the selected colour, because the gallery and the info column are
 * siblings and both depend on it — the gallery for its images, the info column
 * for price, stock and what goes into the cart.
 *
 * A product with no variants renders exactly as before: no selector, product
 * level images and price.
 */
export function ProductDetail({ product }: ProductDetailProps) {
  const variants = product.colorVariants;

  // Defaults to the first variant by `order` — the repository already sorts.
  const [selectedId, setSelectedId] = React.useState<string | null>(
    variants[0]?.id ?? null,
  );

  const selected: ColorVariant | null =
    variants.find((variant) => variant.id === selectedId) ?? variants[0] ?? null;

  /**
   * Fall back to the product's own images when a colour has none of its own,
   * so a half-filled variant never renders an empty gallery.
   */
  const images =
    selected && selected.imageUrls.length > 0 ? selected.imageUrls : product.imageUrls;

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-14">
      <ProductGallery
        // Remount on colour change so the gallery resets to the first image
        // of the new colour instead of holding an index the new set may not
        // have.
        key={selected?.id ?? 'default'}
        images={images}
        productName={product.name}
        className="lg:sticky lg:top-28 lg:self-start"
      />
      <ProductInfo
        product={product}
        selectedVariant={selected}
        onSelectVariant={(variant) => setSelectedId(variant.id)}
      />
    </section>
  );
}
