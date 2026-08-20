/**
 * Shared by every admin route that stores a focal point (CSS object-position)
 * as a whole percentage, 0-100 — extracted here because a third route
 * (categories) was about to duplicate the five lines already living in
 * site-config's route file.
 */

/** Focal percentages, clamped to what `object-position` can use. */
export function parsePercent(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(100, Math.max(0, Math.round(n)));
}
