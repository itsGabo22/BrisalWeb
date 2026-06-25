'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchX, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import type { Category, Product, Tag } from '@/types';
import { ProductFilters } from './ProductFilters';
import { ProductGrid } from './ProductGrid';

export interface CatalogContentProps {
  products: Product[];
  tags: Tag[];
  categories: Category[];
  activeTagSlug?: string;
}

export function CatalogContent({
  products,
  tags,
  categories,
  activeTagSlug,
}: CatalogContentProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <section className="bg-brand-pearl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label={'Filtros del cat\u00e1logo'}>
          <div className="sticky top-28 space-y-8">
            <CatalogSidebar
              tags={tags}
              categories={categories}
              activeTagSlug={activeTagSlug}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-sans text-xs text-brand-neutral-500" aria-live="polite">
              {products.length} productos encontrados
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="mr-2 size-4" aria-hidden="true" />
              Filtros
            </Button>
          </div>

          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyCatalogState resetHref={pathname} />
          )}
        </div>
      </div>

      <Modal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros"
        className="fixed inset-x-0 bottom-0 top-auto max-h-[85vh] max-w-none rounded-b-none rounded-t-xl sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:max-h-[85vh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
        glass
        footer={
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => setFiltersOpen(false)}
          >
            Ver resultados ({products.length})
          </Button>
        }
      >
        <CatalogSidebar
          tags={tags}
          categories={categories}
          activeTagSlug={activeTagSlug}
          onNavigate={() => setFiltersOpen(false)}
        />
      </Modal>
    </section>
  );
}

interface CatalogSidebarProps {
  tags: Tag[];
  categories: Category[];
  activeTagSlug?: string;
  onNavigate?: () => void;
}

function CatalogSidebar({
  tags,
  categories,
  activeTagSlug,
  onNavigate,
}: CatalogSidebarProps) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="catalog-filter-heading" className="space-y-4">
        <h2
          id="catalog-filter-heading"
          className="font-serif text-base font-semibold text-brand-neutral-900"
        >
          Filtrar por
        </h2>
        <ProductFilters tags={tags} activeTagSlug={activeTagSlug} />
      </section>

      <section aria-labelledby="catalog-category-heading" className="space-y-4">
        <h2
          id="catalog-category-heading"
          className="font-serif text-base font-semibold text-brand-neutral-900"
        >
          {'Ver todas las categor\u00edas'}
        </h2>
        <CategoryTree categories={categories} onNavigate={onNavigate} />
      </section>
    </div>
  );
}

interface CategoryTreeProps {
  categories: Category[];
  onNavigate?: () => void;
}

function CategoryTree({ categories, onNavigate }: CategoryTreeProps) {
  return (
    <nav aria-label={'Categor\u00edas del cat\u00e1logo'}>
      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category.id} className="space-y-2">
            <Link
              href={`/catalogo/${category.slug}`}
              onClick={onNavigate}
              className="block rounded-sm font-sans text-sm font-semibold text-brand-neutral-800 transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              {category.name}
            </Link>
            {category.children && category.children.length > 0 && (
              <ul className="space-y-1 border-l border-brand-gold/25 pl-3">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/catalogo/${category.slug}/${child.slug}`}
                      onClick={onNavigate}
                      className="block rounded-sm py-1 font-sans text-sm text-brand-neutral-600 transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function EmptyCatalogState({ resetHref }: { resetHref: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-brand-gold/20',
        'bg-white/45 px-6 py-14 text-center shadow-sm backdrop-blur-sm',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-full border border-brand-gold/25 bg-brand-gold/10 text-brand-gold">
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <h2 className="font-serif text-xl font-semibold text-brand-neutral-900">
        No encontramos productos con ese filtro
      </h2>
      <Button asChild className="mt-6" variant="primary">
        <Link href={resetHref}>Ver todos</Link>
      </Button>
    </div>
  );
}
