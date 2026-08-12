'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

import { formatCOP } from '@/lib/utils/pricing';
import type { CategoryFacet, ColorFacet, MaterialFacet } from '@/lib/catalog';
import { useFilterNav } from './useFilterNav';

export interface ActiveFilterChipsProps {
  categories: CategoryFacet[];
  colors: ColorFacet[];
  materials: MaterialFacet[];
}

interface Chip {
  key: string;
  label: string;
  /** Params to drop when this chip is dismissed. */
  clears: string[];
  /** Remaining value for a multi-select param, or null to delete it. */
  remaining?: { param: string; value: string | null };
}

/**
 * The removable chips above the grid. Reads the same URL params the sidebar
 * writes, so the two stay in sync without shared client state.
 *
 * `sort` / `filter` / `tag` are intentionally NOT shown: those come from the
 * nav's intent links and are the identity of the page the shopper chose
 * ("Novedades", "Descuentos"), not a filter they added on top of it. Letting
 * them be dismissed here would silently change which page they are on.
 */
export function ActiveFilterChips({
  categories,
  colors,
  materials,
}: ActiveFilterChipsProps) {
  const searchParams = useSearchParams();
  const { setParams, clearAll } = useFilterNav();

  const chips = React.useMemo<Chip[]>(() => {
    const params = new URLSearchParams(searchParams.toString());
    const result: Chip[] = [];

    const multi = (
      param: string,
      lookup: (slug: string) => string | undefined,
    ) => {
      const values = (params.get(param) ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const value of values) {
        const label = lookup(value);
        if (!label) continue;
        const rest = values.filter((v) => v !== value);
        result.push({
          key: `${param}:${value}`,
          label,
          clears: [],
          remaining: { param, value: rest.length ? rest.join(',') : null },
        });
      }
    };

    multi('categoria', (slug) => categories.find((c) => c.slug === slug)?.name);
    multi('color', (slug) => colors.find((c) => c.slug === slug)?.name);
    multi('material', (slug) => materials.find((m) => m.slug === slug)?.name);

    const min = params.get('precioMin');
    const max = params.get('precioMax');
    if (min || max) {
      const from = min ? formatCOP(Number(min)) : null;
      const to = max ? formatCOP(Number(max)) : null;
      result.push({
        key: 'precio',
        label:
          from && to ? `${from} — ${to}` : from ? `Desde ${from}` : `Hasta ${to}`,
        clears: ['precioMin', 'precioMax'],
      });
    }

    return result;
  }, [searchParams, categories, colors, materials]);

  if (chips.length === 0) return null;

  const dismiss = (chip: Chip) => {
    const next: Record<string, string | null> = {};
    for (const key of chip.clears) next[key] = null;
    if (chip.remaining) next[chip.remaining.param] = chip.remaining.value;
    setParams(next);
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => dismiss(chip)}
          className="border-brand-gold/40 bg-brand-gold/10 text-brand-gold-deep hover:bg-brand-gold/20 focus-visible:ring-brand-gold inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-body text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`Quitar filtro ${chip.label}`}
        >
          {chip.label}
          <X className="size-3" aria-hidden="true" />
        </button>
      ))}

      <button
        type="button"
        onClick={clearAll}
        className="text-brand-text-soft hover:text-brand-text focus-visible:ring-brand-gold ml-1 rounded-sm font-body text-xs underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
