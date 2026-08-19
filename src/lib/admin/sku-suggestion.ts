import { prisma } from '@/lib/prisma';

/**
 * Proposing a free SKU when the admin types one that is already taken.
 *
 * This does NOT regenerate or overwrite anything. Client-authored SKUs
 * (`BSA-ANI-001`, …) remain the source of truth, and nothing here is ever
 * written: the routes return the suggestion alongside the 409 and the admin has
 * to click to accept it, so a reference only ever changes because a human chose
 * to change it. That is the whole reason this is a suggestion and not a fixup.
 */

/**
 * Splits `CLPRRJ-S-2` into `{ base: 'CLPRRJ-S', suffix: 2 }`, and `CLPRRJ-S`
 * into `{ base: 'CLPRRJ-S', suffix: null }`.
 *
 * Stripping an existing numeric tail matters: retrying against a taken
 * `CLPRRJ-S-2` should offer `CLPRRJ-S-3`, not `CLPRRJ-S-2-2`.
 */
function splitSku(sku: string): { base: string; suffix: number | null } {
  const match = sku.match(/^(.*?)-(\d+)$/);
  if (!match) return { base: sku, suffix: null };
  return { base: match[1], suffix: Number(match[2]) };
}

/**
 * The next free `base-N` for a taken SKU, or `null` if none could be proposed.
 *
 * Scans every SKU sharing the base rather than blindly trying `-2`, so a base
 * that already has `-2` and `-3` in use is offered `-4`. Comparison is
 * case-insensitive because `Product.sku` is unique on the exact string and two
 * casings of one reference would be a confusing near-duplicate, not a free slot.
 *
 * @param requested The SKU the admin typed, which is already known to collide.
 * @param excludeProductId Ignore this product's own SKU — on edit, the product
 *   being saved is not a conflict with itself.
 */
export async function suggestAvailableSku(
  requested: string,
  excludeProductId?: string,
): Promise<string | null> {
  const trimmed = requested.trim();
  if (!trimmed) return null;

  const { base } = splitSku(trimmed);
  if (!base) return null;

  const rows = await prisma.product.findMany({
    where: {
      sku: { startsWith: base, mode: 'insensitive' },
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: { sku: true },
  });

  const taken = new Set(
    rows.map((row) => (row.sku ?? '').trim().toLowerCase()).filter(Boolean),
  );

  // Bounded: a base with 200 numbered siblings is a data problem, not something
  // to keep probing for. Returning null just means "no suggestion offered".
  for (let n = 2; n <= 200; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }

  return null;
}

/**
 * Whether `sku` is already used by a different product.
 *
 * Checked explicitly ahead of the write so the route can answer with a
 * suggestion. The P2002 mapping in `admin-errors` stays as the backstop for the
 * race between this check and the insert.
 */
export async function findSkuConflict(
  sku: string,
  excludeProductId?: string,
): Promise<{ id: string; name: string; sku: string | null } | null> {
  const trimmed = sku.trim();
  if (!trimmed) return null;

  return prisma.product.findFirst({
    where: {
      sku: { equals: trimmed, mode: 'insensitive' },
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: { id: true, name: true, sku: true },
  });
}
