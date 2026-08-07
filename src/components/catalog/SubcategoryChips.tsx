import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { Category } from '@/types';

export interface SubcategoryChipsProps {
  parentSlug: string;
  subcategories: Category[];
  activeSlug?: string;
}

export function SubcategoryChips({
  parentSlug,
  subcategories,
  activeSlug,
}: SubcategoryChipsProps) {
  if (subcategories.length === 0) return null;

  return (
    <section className="border-b border-brand-neutral-200/70 bg-brand-pearl px-4 py-4 sm:px-6 lg:px-8">
      <nav
        className="momentum-scroll-x mx-auto flex max-w-7xl gap-2 overflow-x-auto"
        aria-label={'Subcategor\u00edas'}
      >
        {subcategories.map((subcategory) => {
          const isActive = activeSlug === subcategory.slug;

          return (
            <Link
              key={subcategory.id}
              href={`/catalogo/${parentSlug}/${subcategory.slug}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap rounded-full border px-4 py-2 font-body text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2',
                isActive
                  ? 'border-brand-gold bg-brand-gold/12 text-brand-gold-deep'
                  : 'border-brand-line text-brand-text-soft hover:border-brand-gold/60 hover:text-brand-gold-deep',
              )}
            >
              {subcategory.name}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
