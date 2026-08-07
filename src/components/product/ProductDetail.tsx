'use client';

import * as React from 'react';

import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import { getSelectableColors } from '@/lib/utils/product-options';
import type { Product } from '@/types';

export interface ProductDetailProps {
  product: Product;
}

/**
 * Owns the selected colour, because the gallery and the info column are
 * siblings and both depend on it — the gallery for its images, the info column
 * for price, stock and what goes into the cart.
 *
 * The colour list comes from `getSelectableColors`, which puts the product's
 * PRIMARY colour first and the additional variants after it. A product with
 * neither renders exactly as before: no colour UI at all.
 */
export function ProductDetail({ product }: ProductDetailProps) {
  const colors = React.useMemo(() => getSelectableColors(product), [product]);

  // Defaults to the primary colour, which is always index 0 when one exists.
  const [selectedId, setSelectedId] = React.useState<string | null>(
    colors[0]?.id ?? null,
  );

  const selected =
    colors.find((color) => color.id === selectedId) ?? colors[0] ?? null;

  const images =
    selected && selected.imageUrls.length > 0 ? selected.imageUrls : product.imageUrls;

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-14">
      <ProductGallery
        // Remount on colour change so the gallery resets to the first image of
        // the new colour instead of holding an index the new set may not have.
        key={selected?.id ?? 'default'}
        images={images}
        productName={product.name}
        className="lg:sticky lg:top-28 lg:self-start"
      />
      <ProductInfo
        product={product}
        colors={colors}
        selectedColor={selected}
        onSelectColor={(color) => setSelectedId(color.id)}
      />
    </section>
  );
}
