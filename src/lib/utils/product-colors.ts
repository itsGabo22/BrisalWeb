/**
 * The single seam between the catalog's colour FILTER and the per-product
 * colour system that Phase 4 will build.
 *
 * Colours now come from the real `ColorVariant` table: each variant carries a
 * `colorName` and a `colorHex`, so both the facet label and its swatch are
 * authored by the client in the admin rather than guessed here.
 *
 * The `COLOR_SWATCHES` map below is only a fallback for a variant saved
 * without a usable hex. `material` is still deliberately NOT treated as a
 * colour — its values are "Acero", "Rodio", "Baño de rodio", which are
 * materials.
 */
import type { Product } from '@/types';
import { getProductColorNames, getSelectableColors } from './product-options';

/** Canonical swatch hexes for the colour names a Spanish catalog will use. */
const COLOR_SWATCHES: Record<string, string> = {
  dorado: '#C9A96E',
  plateado: '#C0C4C9',
  plata: '#C0C4C9',
  oro: '#D4AF37',
  'oro rosa': '#E0B0A0',
  rosado: '#E8B4C0',
  rosa: '#E8B4C0',
  negro: '#2A2521',
  blanco: '#FFFFFF',
  perla: '#F2ECE2',
  nacar: '#F4F0E8',
  beige: '#E8DCC8',
  cafe: '#7A5C3E',
  marron: '#7A5C3E',
  rojo: '#B03A3A',
  vinotinto: '#6E2436',
  azul: '#3B5C8A',
  celeste: '#9CC2DE',
  verde: '#4C7A5A',
  turquesa: '#4EA8A0',
  morado: '#6B4EAB',
  lila: '#B9A5D6',
  amarillo: '#E0C25C',
  naranja: '#D98A4B',
  gris: '#8A8A85',
  multicolor: '#C9A96E',
};

/** Strips accents/case so "Café" and "cafe" resolve to the same swatch/slug. */
function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function colorSlug(name: string): string {
  return normalize(name).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Swatch hex for a colour name; a neutral sand for anything unrecognised. */
export function colorSwatch(name: string): string {
  return COLOR_SWATCHES[normalize(name)] ?? '#E5DDD2';
}

/** A hex the browser can actually paint. Guards against half-typed values. */
function isUsableHex(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

/**
 * The colours a product is available in — its PRIMARY colour plus every
 * additional variant colour. Delegates to `getProductColorNames` so the filter
 * and the product page can never disagree about what a product offers.
 */
export function getProductColors(product: Product): string[] {
  return getProductColorNames(product);
}

export interface ColorFacet {
  slug: string;
  name: string;
  swatch: string;
  count: number;
}

/**
 * Builds the colour facet list from the products' variants. Returns [] when no
 * product has any — which is what makes the Colour section disappear rather
 * than render an empty box.
 *
 * The swatch prefers the hex the client authored on the variant, falling back
 * to the name-based map only when that hex is missing or malformed.
 */
export function getColorFacets(products: Product[]): ColorFacet[] {
  const byslug = new Map<string, ColorFacet>();

  for (const product of products) {
    // Primary first, then variants — `getSelectableColors` already carries the
    // resolved hex for each, so the facet swatch matches the one the shopper
    // sees on the product page.
    const seen = new Set<string>();
    for (const color of getSelectableColors(product)) {
      const name = color.colorName;
      const slug = colorSlug(name);
      if (!slug || seen.has(slug)) continue;
      // A product offering the same colour as primary AND as a variant counts
      // once.
      seen.add(slug);

      const existing = byslug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        byslug.set(slug, {
          slug,
          name,
          swatch: isUsableHex(color.colorHex) ? color.colorHex : colorSwatch(name),
          count: 1,
        });
      }
    }
  }

  return [...byslug.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** True when the product is available in any of the requested colour slugs. */
export function productMatchesColors(product: Product, slugs: string[]): boolean {
  if (slugs.length === 0) return true;
  const productSlugs = getProductColors(product).map(colorSlug);
  return slugs.some((slug) => productSlugs.includes(slug));
}
