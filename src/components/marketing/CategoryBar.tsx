'use client';

import * as React from 'react';
import Link from 'next/link';
import { CategoryIcon } from './CategoryIcon';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryBarProps {
  categories: Category[];
}

const FALLBACK_ICONS: Record<string, string> = {
  aretes: '✨',
  collares: '📿',
  pulseras: '📿',
  brazaletes: '✨',
  anillos: '💍',
  prendedores: '🎗️',
  accesorios: '👜',
  belleza: '💄',
};

export function CategoryBar({ categories }: CategoryBarProps) {
  return (
    <div className="w-full border-y border-brand-neutral-100 bg-white shadow-2xs">
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label="Categorías principales"
          className="scrollbar-none flex items-center gap-6 overflow-x-auto px-4 py-3.5 sm:gap-8 lg:justify-center lg:overflow-x-visible lg:px-8"
        >
          {categories.map((category) => {
            const fallbackEmoji = FALLBACK_ICONS[category.slug] || '✨';

            return (
              <Link
                key={category.id}
                href={`/catalogo/${category.slug}`}
                className="group flex shrink-0 items-center gap-2.5 rounded-full px-1.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-neutral-200 bg-brand-neutral-50/50 transition-all group-hover:scale-105 group-hover:border-brand-gold group-hover:bg-brand-gold/10">
                  <CategoryIcon
                    slug={category.slug}
                    name={category.name}
                    fallbackEmoji={fallbackEmoji}
                    className="h-5 w-5 object-contain"
                  />
                </div>
                <span className="font-sans text-[11px] font-semibold tracking-wider text-brand-neutral-800 uppercase transition-colors group-hover:text-brand-gold sm:text-xs">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
