/**
 * Shared hero-slide helpers.
 *
 * Lives here rather than in the route file because a Next.js route module may
 * only export HTTP handlers and route config — an extra named export fails the
 * build's route type-check.
 */

/**
 * A focal-point percentage from the admin form, clamped to the 0-100 that CSS
 * `object-position` accepts.
 *
 * Anything missing or unparseable falls back to `fallback`: 50 when creating,
 * and the STORED value when editing. That distinction matters — the reorder and
 * activate/deactivate actions PATCH with a FormData carrying only `order` or
 * `active`, so defaulting to centre would quietly discard a crop the client had
 * already arranged every time they moved a slide up the list.
 */
export function parsePercent(value: FormDataEntryValue | null, fallback: number): number {
  if (typeof value !== 'string' || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}
