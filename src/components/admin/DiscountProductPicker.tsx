'use client';

import * as React from 'react';
import Image from 'next/image';
import { Search, CalendarClock, CheckSquare, Square } from 'lucide-react';

import { resolveProductImageUrl } from '@/lib/utils/product-images';
import type { Product } from '@/types';

/** A product is "old stock" past this many days. 2 months, as the client asked. */
export const OLD_PRODUCT_DAYS = 60;

export function isOlderThan(product: Product, days: number, nowMs: number): boolean {
  return nowMs - new Date(product.createdAt).getTime() > days * 24 * 60 * 60 * 1000;
}

/**
 * Human age in Spanish — "hace 3 meses".
 *
 * Deliberately coarse: the picker only has to make it obvious which rows the
 * 2-month quick-select will catch, so days-then-months is enough and reads
 * better than an exact duration.
 */
export function formatAge(createdAt: string, nowMs: number): string {
  const days = Math.floor((nowMs - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'hoy';
  if (days === 1) return 'hace 1 día';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'hace 1 mes';
  if (months < 12) return `hace ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'hace 1 año' : `hace ${years} años`;
}

export interface DiscountProductPickerProps {
  products: Product[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  /**
   * "Now" as a fixed instant, captured when the products were fetched. Passed
   * in rather than read here because reading the clock during render makes the
   * displayed ages depend on when React happens to re-render.
   */
  nowMs: number;
}

/**
 * Multi-select for a PRODUCT-scoped campaign.
 *
 * Replaces a single `<select>` that could only ever pick one product, which is
 * why applying one promo to twenty items previously meant creating twenty
 * separate discounts.
 */
export function DiscountProductPicker({
  products,
  selectedIds,
  onChange,
  nowMs,
}: DiscountProductPickerProps) {
  const [search, setSearch] = React.useState('');

  const visible = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        (product.category?.name ?? '').toLowerCase().includes(term),
    );
  }, [products, search]);

  const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  // "Todos" operates on what the search has narrowed to, not the whole
  // catalog — ticking it after searching "aretes" should select the aretes,
  // which is the only reading that makes the search box useful here.
  const visibleIds = visible.map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      onChange(selectedIds.filter((id) => !visibleIds.includes(id)));
    } else {
      onChange([...new Set([...selectedIds, ...visibleIds])]);
    }
  };

  const oldIds = products
    .filter((product) => isOlderThan(product, OLD_PRODUCT_DAYS, nowMs))
    .map((product) => product.id);

  /**
   * ADDITIVE, not a replacement: it is phrased as an action ("seleccionar…"),
   * and adding to the selection lets the admin combine "these three new pieces"
   * with "everything older than two months". Replacing would silently discard
   * work they had already done, which is the harder mistake to undo — and
   * "Limpiar" below makes replace-style use one extra click away.
   */
  const selectOld = () => onChange([...new Set([...selectedIds, ...oldIds])]);

  const toggleOne = (id: string) =>
    onChange(
      selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-brand-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="w-full rounded border border-brand-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs text-brand-neutral-800 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
          />
        </div>

        <button
          type="button"
          onClick={selectOld}
          disabled={oldIds.length === 0}
          className="inline-flex items-center gap-1.5 rounded border border-brand-gold/50 bg-brand-gold/10 px-2.5 py-1.5 text-xs font-medium text-brand-gold-deep transition-colors hover:bg-brand-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
          title="Añade a la selección actual todos los productos con más de 2 meses"
        >
          <CalendarClock className="size-3.5" />
          Más de 2 meses ({oldIds.length})
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-brand-neutral-100 pb-2 dark:border-brand-neutral-800">
        <button
          type="button"
          onClick={toggleAllVisible}
          disabled={visibleIds.length === 0}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-neutral-700 transition-colors hover:text-brand-gold disabled:opacity-40 dark:text-brand-neutral-300"
        >
          {allVisibleSelected ? (
            <CheckSquare className="size-4 text-brand-gold" />
          ) : (
            <Square className="size-4" />
          )}
          {search.trim() ? 'Seleccionar todos los filtrados' : 'Seleccionar todos'}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-brand-neutral-600 dark:text-brand-neutral-400">
            {selectedIds.length}{' '}
            {selectedIds.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
          </span>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-brand-neutral-500 underline underline-offset-2 transition-colors hover:text-red-500"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="max-h-72 space-y-1 overflow-y-auto rounded border border-brand-neutral-200 p-1.5 dark:border-brand-neutral-800">
        {visible.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-brand-neutral-400">
            Ningún producto coincide con la búsqueda.
          </p>
        ) : (
          visible.map((product) => {
            const isOld = isOlderThan(product, OLD_PRODUCT_DAYS, nowMs);
            return (
              <label
                key={product.id}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded px-2 py-1.5 transition-colors hover:bg-brand-neutral-50 dark:hover:bg-brand-neutral-800/40"
              >
                <input
                  type="checkbox"
                  checked={selected.has(product.id)}
                  onChange={() => toggleOne(product.id)}
                  className="size-4 shrink-0 rounded border-brand-neutral-300 text-brand-gold focus:ring-brand-gold"
                />

                <span className="relative size-9 shrink-0 overflow-hidden rounded border border-brand-neutral-100 bg-brand-neutral-50 dark:border-brand-neutral-800 dark:bg-brand-neutral-950">
                  {product.imageUrls?.[0] ? (
                    <Image
                      src={resolveProductImageUrl(product.imageUrls[0])}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-brand-neutral-800 dark:text-brand-neutral-200">
                    {product.name}
                  </span>
                  <span className="block truncate text-[11px] text-brand-neutral-400">
                    {product.category?.name ?? 'Sin categoría'}
                  </span>
                </span>

                {/* The age is what makes the 2-month quick-select legible —
                    without it there is no way to tell which rows it caught. */}
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                    isOld
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'text-brand-neutral-400'
                  }`}
                >
                  {formatAge(product.createdAt, nowMs)}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
