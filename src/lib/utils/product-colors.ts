/**
 * The single seam between the catalog's colour FILTER and the per-product
 * colour system that Phase 4 will build.
 *
 * ── State of the data today ──────────────────────────────────────────────
 * There is no colour anywhere in the schema. Verified against the live DB:
 *   • `Product` has no colour column (only `material`, free text — and its
 *     values are "Acero", "Rodio", "Baño de rodio"… i.e. materials, not
 *     colours, so they are deliberately NOT treated as colours here).
 *   • There is no `ProductVariant` table. `Product.variants` exists on the
 *     TypeScript type only and `toProduct` never populates it.
 *   • The only two Tags in the catalog are "Acero" and "Rodio" — again
 *     materials.
 *
 * So `getProductColors` returns an empty array for every product right now,
 * the facet list comes out empty, and CatalogFilters hides its Colour section
 * instead of inventing swatches. Nothing is hardcoded and nothing is faked.
 *
 * ── What Phase 4 needs to populate ───────────────────────────────────────
 * Fill EITHER of the two shapes this function already reads and the filter
 * starts working with no further changes here:
 *
 *   1. `product.variants[]`  — give each variant a `name` that starts with
 *      the colour, e.g. "Dorado", "Dorado - Talla M". Everything before the
 *      first "-" is taken as the colour.
 *   2. `product.customAttributes` — a "Color" (or "color") key whose value is
 *      the colour name, optionally comma-separated for multi-colour pieces.
 *
 * If Phase 4 instead adds a real `Product.color` column or a `Color`
 * relation, extend THIS function and the whole filter follows.
 */
import type { Product } from '@/types';

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

/** Title-cases a colour name for display: "oro rosa" → "Oro rosa". */
function toDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * The colours a single product is available in. Empty until Phase 4 populates
 * one of the shapes described at the top of this file.
 */
export function getProductColors(product: Product): string[] {
  const found = new Set<string>();

  for (const variant of product.variants ?? []) {
    // "Dorado - Talla M" → "Dorado". A variant named only for a size
    // ("Talla M") yields a colour too, which is wrong — but that is a Phase 4
    // naming concern, and the guidance above tells it to lead with the colour.
    const colorPart = variant.name.split('-')[0];
    if (colorPart?.trim()) found.add(toDisplayName(colorPart));
  }

  const attributes = product.customAttributes ?? {};
  const rawAttribute =
    attributes.Color ?? attributes.color ?? attributes.Colores ?? attributes.colores;
  if (rawAttribute) {
    for (const part of rawAttribute.split(',')) {
      if (part.trim()) found.add(toDisplayName(part));
    }
  }

  return [...found];
}

export interface ColorFacet {
  slug: string;
  name: string;
  swatch: string;
  count: number;
}

/**
 * Builds the colour facet list from whatever colour data the products carry.
 * Returns [] when nothing does — which is what makes the Colour section
 * disappear rather than render an empty box.
 */
export function getColorFacets(products: Product[]): ColorFacet[] {
  const byslug = new Map<string, ColorFacet>();

  for (const product of products) {
    // A product available in the same colour twice must only count once.
    const seen = new Set<string>();
    for (const name of getProductColors(product)) {
      const slug = colorSlug(name);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      const existing = byslug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        byslug.set(slug, { slug, name, swatch: colorSwatch(name), count: 1 });
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
