'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchPageFormProps {
  /** The query the page was rendered for, so the box shows it back. */
  initialQuery: string;
}

/**
 * The search box on /buscar.
 *
 * Why this exists: /buscar read `?q=` and rendered results, but had no input.
 * Arriving without a query — which is exactly what the footer's "Buscar" link
 * did — left the shopper on a page that said "Escribe algo para buscar" with
 * nothing to type into and no way forward. The header's overlay was the only
 * real way to search.
 *
 * A GET navigation rather than fetch-as-you-type: this is the shareable,
 * bookmarkable results page, so the query belongs in the URL. The overlay
 * already covers the type-ahead case and pushes here for the full list, so
 * duplicating its debounced fetching would be a second search implementation to
 * keep in step with the first.
 */
export function SearchPageForm({ initialQuery }: SearchPageFormProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialQuery);

  /**
   * The box follows the URL: hitting back, or landing on a shared link, must
   * not leave a stale term sitting in the input next to different results.
   *
   * Adjusted during render rather than in an effect — React's own recommended
   * shape for "reset state when a prop changes". An effect would re-render a
   * second time after painting the stale value, and the repo's lint rules
   * reject synchronous setState in an effect for exactly that reason.
   */
  const [syncedQuery, setSyncedQuery] = React.useState(initialQuery);
  if (syncedQuery !== initialQuery) {
    setSyncedQuery(initialQuery);
    setValue(initialQuery);
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/buscar?q=${encodeURIComponent(trimmed)}` : '/buscar');
  };

  return (
    <form onSubmit={handleSubmit} role="search" className="mx-auto max-w-xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand-neutral-400"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar accesorios, categorías…"
          aria-label="Buscar accesorios, categorías"
          className="w-full rounded-full border border-brand-neutral-200 bg-white py-4 pl-12 pr-28 font-body text-base text-brand-neutral-900 placeholder:text-brand-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-brand-gold px-5 py-2.5 font-body text-sm font-medium text-brand-text transition-colors active:scale-95 hover:bg-brand-gold-deep hover:text-white"
        >
          Buscar
        </button>
      </div>
      <p className="mt-3 text-center font-body text-xs text-brand-neutral-400">
        No te preocupes por la ortografía — encontramos el producto igual.
      </p>
    </form>
  );
}
