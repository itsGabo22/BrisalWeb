/**
 * The top-level nav is intent-based, not category-based: it answers "what am I
 * here to do?" rather than "what shapes of jewelry exist?". The category list
 * moved to the homepage's Categorías showcase and the mobile drawer's
 * accordion, both of which read from categoryRepository.
 *
 * Every href here resolves today. The query params are the contract Phase 3's
 * filter sidebar will read; until then src/lib/catalog.ts normalizes each one
 * to a known value or drops it, so none of these can 404 or land on an
 * unexplained empty grid.
 */
export interface NavSection {
  label: string;
  href: string;
}

export const NAV_SECTIONS: readonly NavSection[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Novedades', href: '/catalogo?sort=nuevo' },
  { label: 'Descuentos', href: '/catalogo?filter=descuento' },
  { label: 'Ideas para regalar', href: '/catalogo?tag=regalo' },
] as const;

export const WHOLESALE_SECTION: NavSection = {
  label: 'Mayorista',
  href: '/mayoristas',
};

/**
 * The one search destination, so nothing can drift.
 *
 * The header opens `SearchOverlay` rather than navigating — but the overlay's
 * "Ver los N resultados" pushes to exactly this href, which makes it the real
 * search route and not a second, parallel path. The footer link now points at
 * this constant instead of repeating the string, so a future move of the route
 * cannot leave one of the two behind (which is how the footer's copy came to be
 * a dead end in the first place).
 */
export const SEARCH_SECTION: NavSection = {
  label: 'Buscar',
  href: '/buscar',
};
