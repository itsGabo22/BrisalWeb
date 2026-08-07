'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { formatCOP } from '@/lib/utils/pricing';
import type { CategoryFacet, ColorFacet, PriceBounds } from '@/lib/catalog';
import { useFilterNav } from './useFilterNav';

export interface CatalogFiltersProps {
  categories: CategoryFacet[];
  colors: ColorFacet[];
  priceBounds: PriceBounds | null;
}

export interface CatalogFilterDrawerProps extends CatalogFiltersProps {
  /** Result count, shown under the drawer's apply button. */
  resultCount: number;
}

interface Draft {
  categoria: string[];
  color: string[];
  precioMin?: number;
  precioMax?: number;
}

function readDraft(params: URLSearchParams): Draft {
  const list = (key: string) =>
    (params.get(key) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const num = (key: string) => {
    const raw = params.get(key);
    if (raw === null) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  return {
    categoria: list('categoria'),
    color: list('color'),
    precioMin: num('precioMin'),
    precioMax: num('precioMax'),
  };
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Shared filter state for both presentations. The desktop sidebar and the
 * mobile drawer differ only in WHEN they commit, so reading the URL, writing
 * the next one, and clearing all live here once.
 */
function useFilterDraft() {
  const searchParams = useSearchParams();
  const { setParams, clearAll } = useFilterNav();

  const applied = React.useMemo(
    () => readDraft(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [draft, setDraft] = React.useState<Draft>(applied);

  // Re-sync the draft whenever the URL changes underneath it — back/forward
  // navigation, or a chip removed from the results area. Adjusted during
  // render rather than in an effect: React re-runs this component immediately
  // with the corrected state and never commits the stale draft to the DOM, so
  // there is no flash of the previous selection and no cascading effect pass.
  const [syncedFrom, setSyncedFrom] = React.useState(applied);
  if (syncedFrom !== applied) {
    setSyncedFrom(applied);
    setDraft(applied);
  }

  const commit = React.useCallback(
    (next: Draft) => {
      setParams({
        categoria: next.categoria.length ? next.categoria.join(',') : null,
        color: next.color.length ? next.color.join(',') : null,
        precioMin: next.precioMin !== undefined ? String(next.precioMin) : null,
        precioMax: next.precioMax !== undefined ? String(next.precioMax) : null,
      });
    },
    [setParams],
  );

  const activeCount =
    applied.categoria.length +
    applied.color.length +
    (applied.precioMin !== undefined || applied.precioMax !== undefined ? 1 : 0);

  return { draft, setDraft, commit, clearAll, activeCount };
}

/**
 * Desktop sidebar. Applies live: it sits beside the grid, so every change is
 * immediately visible and an extra "apply" step would be pure friction.
 */
export function CatalogFilters({
  categories,
  colors,
  priceBounds,
}: CatalogFiltersProps) {
  const { draft, setDraft, commit, clearAll } = useFilterDraft();

  const update = (next: Draft) => {
    setDraft(next);
    commit(next);
  };

  return (
    <aside
      className="hidden w-60 shrink-0 lg:block"
      aria-label="Filtros del catálogo"
    >
      <div className="sticky top-28">
        <FilterPanel
          categories={categories}
          colors={colors}
          priceBounds={priceBounds}
          draft={draft}
          onChange={update}
          onClear={clearAll}
        />
      </div>
    </aside>
  );
}

/**
 * Mobile trigger + bottom sheet.
 *
 * The trigger renders inline wherever it is placed — the catalog toolbar row,
 * beside the result count — rather than floating. The bottom-right of the
 * viewport is already taken by the WhatsApp button and the scroll-to-top
 * control, so a sticky bottom bar would stack against them.
 *
 * Unlike the sidebar, the sheet edits a DRAFT and commits on "Filtrar",
 * because it COVERS the results: live updates would be invisible, and every
 * tick would cost a navigation whose outcome the shopper cannot see.
 */
export function CatalogFilterDrawer({
  categories,
  colors,
  priceBounds,
  resultCount,
}: CatalogFilterDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const { draft, setDraft, commit, clearAll, activeCount } = useFilterDraft();

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="border-brand-line bg-brand-pearl text-brand-text hover:border-brand-gold hover:text-brand-gold-deep focus-visible:ring-brand-gold inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-body text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Filtrar
        {activeCount > 0 && (
          <span className="bg-brand-gold/20 text-brand-gold-deep flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-body text-[11px] tabular-nums">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-text/35 fixed inset-0 z-50 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
              onClick={close}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filtros del catálogo"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="bg-brand-pearl fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl shadow-2xl lg:hidden"
            >
              <div className="border-brand-line flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-brand-text font-heading text-lg font-medium">
                  Filtros
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar filtros"
                  className="text-brand-text hover:bg-brand-gold/10 hover:text-brand-gold-deep focus-visible:ring-brand-gold flex size-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <FilterPanel
                  categories={categories}
                  colors={colors}
                  priceBounds={priceBounds}
                  draft={draft}
                  onChange={setDraft}
                  onClear={() => {
                    clearAll();
                    close();
                  }}
                />
              </div>

              <div
                className="border-brand-line bg-brand-pearl border-t px-5 py-4"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    commit(draft);
                    close();
                  }}
                  className="border-brand-gold/70 bg-brand-pearl text-brand-text hover:bg-brand-gold/10 focus-visible:ring-brand-gold w-full rounded-md border py-3 font-body text-sm tracking-[0.1em] shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Filtrar
                </button>
                <p className="text-brand-text-soft mt-2 text-center font-body text-xs">
                  {resultCount} {resultCount === 1 ? 'producto' : 'productos'} con los
                  filtros actuales
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function FilterPanel({
  categories,
  colors,
  priceBounds,
  draft,
  onChange,
  onClear,
}: {
  categories: CategoryFacet[];
  colors: ColorFacet[];
  priceBounds: PriceBounds | null;
  draft: Draft;
  onChange: (next: Draft) => void;
  onClear: () => void;
}) {
  const hasAny =
    draft.categoria.length > 0 ||
    draft.color.length > 0 ||
    draft.precioMin !== undefined ||
    draft.precioMax !== undefined;

  return (
    <div className="space-y-7">
      {categories.length > 0 && (
        <FilterSection title="Categoría del producto">
          <ul className="space-y-2.5" role="list">
            {categories.map((facet) => (
              <li key={facet.id}>
                <CheckboxRow
                  label={facet.name}
                  count={facet.count}
                  checked={draft.categoria.includes(facet.slug)}
                  onChange={() =>
                    onChange({
                      ...draft,
                      categoria: toggle(draft.categoria, facet.slug),
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Hidden entirely until products carry colour data — see
          src/lib/utils/product-colors.ts. An empty box with a heading would
          read as broken. */}
      {colors.length > 0 && (
        <FilterSection title="Color">
          <ul className="space-y-2.5" role="list">
            {colors.map((color) => (
              <li key={color.slug}>
                <CheckboxRow
                  label={color.name}
                  count={color.count}
                  checked={draft.color.includes(color.slug)}
                  onChange={() =>
                    onChange({ ...draft, color: toggle(draft.color, color.slug) })
                  }
                  swatch={color.swatch}
                />
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {priceBounds && (
        <FilterSection title="Rango de precio">
          <PriceRange
            bounds={priceBounds}
            min={draft.precioMin}
            max={draft.precioMax}
            onChange={(min, max) => onChange({ ...draft, precioMin: min, precioMax: max })}
          />
        </FilterSection>
      )}

      {hasAny && (
        <button
          type="button"
          onClick={onClear}
          className="text-brand-gold-deep hover:text-brand-text focus-visible:ring-brand-gold rounded-sm font-body text-sm underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-brand-line border-b pb-7 last:border-b-0 last:pb-0">
      <h3 className="text-brand-text mb-4 font-body text-xs font-medium tracking-[0.16em] uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function CheckboxRow({
  label,
  count,
  checked,
  onChange,
  swatch,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  swatch?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors',
          'peer-focus-visible:ring-brand-gold peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
          checked
            ? 'border-brand-gold bg-brand-gold/20'
            : 'border-brand-line group-hover:border-brand-gold/60',
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
            <path
              d="M2 6.2 4.6 8.8 10 3.4"
              fill="none"
              stroke="#8A6A2F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {swatch && (
        <span
          aria-hidden="true"
          className="border-brand-line size-4 shrink-0 rounded-full border"
          style={{ backgroundColor: swatch }}
        />
      )}

      <span
        className={cn(
          'font-body text-sm transition-colors',
          checked ? 'text-brand-gold-deep' : 'text-brand-text-soft group-hover:text-brand-text',
        )}
      >
        {label}
      </span>
      <span className="text-brand-text-soft/70 ml-auto font-body text-xs tabular-nums">
        ({count})
      </span>
    </label>
  );
}

// ─── Price range ──────────────────────────────────────────────────────────────

/** Delay before a slider drag becomes a navigation. */
const PRICE_COMMIT_MS = 400;

/**
 * Dual-handle range built from two stacked native range inputs.
 *
 * Two inputs rather than a drag library: the natives give keyboard control and
 * touch targets for free. The trick is that they overlap, so the one NOT being
 * dragged must not swallow the pointer — hence `pointer-events-none` on the
 * track with it re-enabled on the thumbs only (see the arbitrary variants
 * below), plus a z-index flip so the handle nearer the pointer wins.
 */
function PriceRange({
  bounds,
  min,
  max,
  onChange,
}: {
  bounds: PriceBounds;
  min?: number;
  max?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  const lo = min ?? bounds.min;
  const hi = max ?? bounds.max;

  // Local state so dragging feels immediate; the URL is written on a debounce.
  const [local, setLocal] = React.useState<[number, number]>([lo, hi]);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Same adjust-during-render sync as the draft above: pull the handles back
  // in line when the URL changes from outside (chip dismissed, Limpiar, or
  // back/forward). Compared by value because these are plain numbers.
  const [syncedFrom, setSyncedFrom] = React.useState<[number, number]>([lo, hi]);
  if (syncedFrom[0] !== lo || syncedFrom[1] !== hi) {
    setSyncedFrom([lo, hi]);
    setLocal([lo, hi]);
  }

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const push = (next: [number, number]) => {
    setLocal(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Bounds-equal values mean "no price filter" — keeps the URL clean and
      // the chip list honest when the shopper drags back to the extremes.
      onChange(
        next[0] <= bounds.min ? undefined : next[0],
        next[1] >= bounds.max ? undefined : next[1],
      );
    }, PRICE_COMMIT_MS);
  };

  const step = Math.max(1000, Math.round((bounds.max - bounds.min) / 100));
  const pct = (value: number) =>
    ((value - bounds.min) / Math.max(1, bounds.max - bounds.min)) * 100;

  const thumb =
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-brand-gold [&::-webkit-slider-thumb]:bg-brand-pearl [&::-webkit-slider-thumb]:shadow-sm ' +
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-brand-gold [&::-moz-range-thumb]:bg-brand-pearl';

  return (
    <div>
      <div className="relative h-4">
        <span className="bg-brand-line absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
        <span
          className="bg-brand-gold absolute top-1/2 h-px -translate-y-1/2"
          style={{ left: `${pct(local[0])}%`, right: `${100 - pct(local[1])}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={local[0]}
          aria-label="Precio mínimo"
          onChange={(e) =>
            push([Math.min(Number(e.target.value), local[1]), local[1]])
          }
          className={cn(
            'pointer-events-none absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 appearance-none bg-transparent',
            local[0] > bounds.max - (bounds.max - bounds.min) * 0.1 ? 'z-20' : 'z-10',
            thumb,
          )}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={local[1]}
          aria-label="Precio máximo"
          onChange={(e) =>
            push([local[0], Math.max(Number(e.target.value), local[0])])
          }
          className={cn(
            'pointer-events-none absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 appearance-none bg-transparent z-20',
            thumb,
          )}
        />
      </div>

      <p className="text-brand-text-soft mt-3 font-body text-sm tabular-nums">
        {formatCOP(local[0])} — {formatCOP(local[1])}
      </p>
    </div>
  );
}
