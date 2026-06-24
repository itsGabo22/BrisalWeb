import { ProductGrid } from '@/components/catalog/ProductGrid';
import type { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-20">
      <div className="mb-8 flex flex-col gap-3">
        <h2 className="font-serif text-2xl font-semibold text-brand-neutral-900 sm:text-3xl">
          También te puede interesar
        </h2>
        <div className="h-px w-24 bg-brand-gold" aria-hidden="true" />
      </div>
      <ProductGrid products={products.slice(0, 4)} />
    </section>
  );
}
