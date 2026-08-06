import { ProductGrid } from '@/components/catalog/ProductGrid';
import type { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
  title?: string;
}

export function RelatedProducts({
  products,
  title = 'También te puede interesar',
}: RelatedProductsProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-20">
      <div className="mb-8 flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-normal text-brand-text sm:text-3xl">
          {title}
        </h2>
        <div className="h-px w-24 bg-brand-gold" aria-hidden="true" />
      </div>
      <ProductGrid products={products.slice(0, 4)} />
    </section>
  );
}
