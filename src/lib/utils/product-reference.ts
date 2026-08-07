/**
 * Human-readable references the client can use to find an item fast.
 *
 * ── Why nothing is regenerated ───────────────────────────────────────────
 * Every existing product already carries a SKU in the client's own scheme
 * (BSA-ANI-001, BSA-COL-001, …). Those are theirs and are treated as the
 * source of truth — overwriting them with a generated "BRISAL-…" string would
 * break the referencing they already use off-site. A reference is only
 * generated for a product that has NO sku, which today is none of them.
 */
import type { ColorVariant, Product } from '@/types';

/** Strips accents and non-alphanumerics, uppercased. */
function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * A fallback reference for a product with no SKU: BRS- plus initials from the
 * name plus a short slice of the id, which keeps it stable across renames-free
 * edits and unique across products without needing a uniqueness check.
 *
 * e.g. "Collar Perlas" + id "cmshzky3h000e04jr…" → "BRS-CP-E04JR"
 */
export function generateProductReference(name: string, id: string): string {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => normalizeToken(word).slice(0, 1))
      .join('') || 'X';
  const tail = normalizeToken(id).slice(-5) || '00000';
  return `BRS-${initials}-${tail}`;
}

/** The product's reference: its own SKU when set, otherwise a generated one. */
export function getProductReference(
  product: Pick<Product, 'id' | 'name' | 'sku'>,
): string {
  const sku = product.sku?.trim();
  return sku ? sku : generateProductReference(product.name, product.id);
}

/**
 * A colour's reference: the product reference plus a short colour code.
 *
 * "Veige Arena" → VEA (first letters of each word, padded from the first word
 * when there's only one), so BSA-ANI-001 + Dorado → "BSA-ANI-001-DOR".
 */
export function colorCode(colorName: string): string {
  const words = colorName.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'XXX';

  if (words.length === 1) {
    return normalizeToken(words[0]).slice(0, 3).padEnd(3, 'X');
  }

  // Multi-word: one letter per word, topped up from the first word so the code
  // is always three characters.
  const initials = words.map((word) => normalizeToken(word).slice(0, 1)).join('');
  return initials.length >= 3
    ? initials.slice(0, 3)
    : (initials + normalizeToken(words[0]).slice(1)).slice(0, 3).padEnd(3, 'X');
}

export function getVariantReference(
  product: Pick<Product, 'id' | 'name' | 'sku'>,
  variant: Pick<ColorVariant, 'colorName'> | null,
): string {
  const base = getProductReference(product);
  return variant ? `${base}-${colorCode(variant.colorName)}` : base;
}
