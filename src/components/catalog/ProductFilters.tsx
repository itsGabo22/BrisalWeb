'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import type { Tag } from '@/types';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ProductFiltersProps {
  tags: Tag[];
  activeTagSlug?: string;
  onTagChange: (tagSlug: string | undefined) => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
// Pure presentation — filtering logic lives in the repository layer.
// The parent page calls productRepository.getAll({ tagSlug }) on tag change.
export function ProductFilters({
  tags,
  activeTagSlug,
  onTagChange,
  className,
}: ProductFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar por etiqueta"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {/* "Todos" chip */}
      <FilterChip
        label="Todos"
        isActive={activeTagSlug === undefined}
        onClick={() => onTagChange(undefined)}
      />

      {/* One chip per tag received in props — no hardcoded strings here */}
      {tags.map((tag) => (
        <FilterChip
          key={tag.id}
          label={tag.name}
          isActive={activeTagSlug === tag.slug}
          onClick={() =>
            onTagChange(activeTagSlug === tag.slug ? undefined : tag.slug)
          }
        />
      ))}
    </div>
  );
}

// ─── Helper chip ──────────────────────────────────────────────────────────────
interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        'rounded-full border px-4 py-1.5 font-sans text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2',
        isActive
          ? 'border-brand-gold bg-brand-gold text-brand-neutral-900'
          : 'border-brand-neutral-200 bg-transparent text-brand-neutral-600 hover:border-brand-gold/60 hover:text-brand-gold',
      )}
    >
      {label}
    </button>
  );
}
