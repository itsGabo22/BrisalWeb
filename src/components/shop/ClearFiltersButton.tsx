'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useFilterNav } from './useFilterNav';

/**
 * The empty state's "Limpiar filtros" action.
 *
 * Deliberately a button driven by `useFilterNav`, not a <Link> to a
 * server-computed href. The href version shipped broken: on /catalogo?filter=
 * descuento it pointed at /catalogo?filter=descuento — the page the shopper
 * was already on — because the href preserved the intent param that was
 * causing the empty result in the first place. Routing it through the same
 * `clearAll` the sidebar and the chips use makes that class of mismatch
 * impossible.
 */
export function ClearFiltersButton() {
  const { clearAll } = useFilterNav();

  return (
    <Button type="button" variant="primary" className="mt-6" onClick={clearAll}>
      Limpiar filtros
    </Button>
  );
}
