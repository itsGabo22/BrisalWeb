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
