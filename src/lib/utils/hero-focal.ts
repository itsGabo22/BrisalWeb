/**
 * Turning a slide's stored focal point into CSS.
 *
 * Presentation-side, so it is shared by the public hero and the admin preview
 * rather than living next to the form parsing in `@/lib/admin/hero-slides`.
 */

/**
 * The `object-position` pair for one breakpoint.
 *
 * Missing coordinates fall back to 50% — dead centre, which is what
 * `object-cover` does unaided — so a slide that never had a focal point set
 * renders exactly as it did before the feature existed.
 */
export function objectPositionOf(x?: number | null, y?: number | null): string {
  return `${x ?? 50}% ${y ?? 50}%`;
}
