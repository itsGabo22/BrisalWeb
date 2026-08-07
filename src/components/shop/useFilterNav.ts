'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * The single source of truth for reading and writing catalog filter state.
 *
 * Three separate controls can clear filters — the sidebar link, the chip row,
 * and the empty state's button — and they previously each built their own
 * target URL. That is how the empty state ended up with a href identical to
 * the page it was already on (a guaranteed no-op). They all go through
 * `clearAll` now, so they cannot diverge again.
 */

/**
 * Everything a "clear" removes.
 *
 * `sort`, `filter` and `tag` are included deliberately. They arrive from the
 * nav's intent links, and the empty state most often appears *because* of one
 * of them ("Descuentos" with nothing on sale) — so a clear that preserved them
 * would leave the shopper looking at the same empty grid.
 *
 * `page` goes too: any change to the result set invalidates the page number.
 */
export const CLEARABLE_PARAMS = [
  'categoria',
  'color',
  'precioMin',
  'precioMax',
  'sort',
  'filter',
  'tag',
  'page',
] as const;

/** Params the sidebar itself owns; a sidebar write replaces exactly these. */
export const SIDEBAR_PARAMS = ['categoria', 'color', 'precioMin', 'precioMax'] as const;

export interface FilterNav {
  /** Current pathname with no query at all — the unfiltered version of this page. */
  clearedHref: string;
  /** True when anything clearable is currently set. */
  hasActiveFilters: boolean;
  /** Navigate to the unfiltered page. */
  clearAll: () => void;
  /** Apply a set of param mutations; `null` deletes. Always resets `page`. */
  setParams: (next: Record<string, string | null>) => void;
}

export function useFilterNav(): FilterNav {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Clearing keeps the PATH and drops the query. On /catalogo/aretes the
  // category is the page the shopper navigated to, not a filter they added, so
  // clearing filters must not eject them from it.
  const clearedHref = pathname;

  const hasActiveFilters = React.useMemo(
    () => CLEARABLE_PARAMS.some((key) => key !== 'page' && searchParams.has(key)),
    [searchParams],
  );

  const clearAll = React.useCallback(() => {
    // `push`, not `replace`: a cleared catalog is a place the shopper should be
    // able to back out of to their previous filtered view.
    router.push(clearedHref, { scroll: false });
  }, [router, clearedHref]);

  const setParams = React.useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      }

      // Any filter change invalidates the current page number.
      params.delete('page');

      const query = params.toString();
      // `scroll: false` keeps the viewport put — re-anchoring to the top of the
      // page on every checkbox tick is disorienting.
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { clearedHref, hasActiveFilters, clearAll, setParams };
}
