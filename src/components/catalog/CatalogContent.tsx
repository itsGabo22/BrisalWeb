import * as React from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CatalogFilters } from '@/components/shop/CatalogFilters';
import { ActiveFilterChips } from '@/components/shop/ActiveFilterChips';
import { CatalogPagination } from '@/components/shop/CatalogPagination';
import type {
  CategoryFacet,
  ColorFacet,
  PaginatedProducts,
  PriceBounds,
} from '@/lib/catalog';
import { ProductGrid } from './ProductGrid';

export interface CatalogContentProps {
  /** Already filtered AND paginated by the page's server component. */
  results: PaginatedProducts;
  categories: CategoryFacet[];
  colors: ColorFacet[];
  priceBounds: PriceBounds | null;
  /** Where "Limpiar filtros" returns to — the unfiltered version of this page. */
  resetHref: string;
}

/**
 * Server component. It renders the interactive pieces (sidebar, chips,
 * pagination) as client islands but does no filtering itself — all narrowing
 * happens on the server from the URL, so a shared link reproduces exactly the
 * same grid rather than hydrating into it.
 */
export function CatalogContent({
  results,
  categories,
  colors,
  priceBounds,
  resetHref,
}: CatalogContentProps) {
  return (
    <section className="bg-brand-pearl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto flex max-w-7xl gap-10">
        <CatalogFilters
          categories={categories}
          colors={colors}
          priceBounds={priceBounds}
          resultCount={results.total}
        />

        {/* min-w-0 so the grid can shrink inside the flex row instead of
            forcing the page wider than the viewport. */}
        <div className="min-w-0 flex-1">
          <p
            className="text-brand-text-soft mb-4 font-body text-xs"
            aria-live="polite"
          >
            {results.total} {results.total === 1 ? 'producto' : 'productos'}
          </p>

          <ActiveFilterChips categories={categories} colors={colors} />

          {results.items.length > 0 ? (
            <>
              <ProductGrid products={results.items} />
              <CatalogPagination
                page={results.page}
                totalPages={results.totalPages}
              />
            </>
          ) : (
            <EmptyCatalogState resetHref={resetHref} />
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyCatalogState({ resetHref }: { resetHref: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-brand-gold/20',
        'bg-brand-cream/60 px-6 py-14 text-center shadow-sm',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="border-brand-gold/25 bg-brand-gold/10 text-brand-gold-deep mb-5 flex size-14 items-center justify-center rounded-full border">
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-brand-text font-heading text-xl font-medium">
        No encontramos productos con estos filtros
      </h2>
      <p className="text-brand-text-soft mt-2 max-w-sm font-body text-sm">
        Prueba con menos filtros o amplía el rango de precio.
      </p>
      <Button asChild className="mt-6" variant="primary">
        <Link href={resetHref}>Limpiar filtros</Link>
      </Button>
    </div>
  );
}
