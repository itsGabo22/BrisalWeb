import { NextResponse } from 'next/server';

/**
 * The catch-all for PUBLIC read handlers, mirroring what
 * `adminReadErrorResponse` does for the admin panel.
 *
 * A separate helper rather than reusing the admin one, for two reasons that
 * matter here:
 *
 *   1. AUDIENCE. The admin message ("No se pudieron cargar los datos") is
 *      written for someone who can act on a failure and who will read a runtime
 *      log. A shopper can do neither, so the default here is phrased as
 *      something transient and human.
 *   2. LOG SEPARATION. Admin faults are the client's operational problem;
 *      public faults are the ones that cost a sale. Keeping the tags distinct
 *      means "how often does checkout break" is answerable without wading
 *      through admin noise.
 *
 * Like the admin version this never attributes blame to a field — a failed read
 * is a server fault — and it guarantees the tagged `console.error` that makes
 * the real stack findable afterwards. Several public routes had no try/catch at
 * all, so a database hiccup became an unhandled rejection: Next answered with
 * its own opaque 500, nothing was logged under a searchable tag, and the
 * client-side `if (res.ok)` branches silently rendered an empty page.
 *
 * @param tag Log prefix identifying the route, e.g. `promo-popup`.
 */
export function publicReadErrorResponse(
  tag: string,
  err: unknown,
  message = 'No se pudo cargar la información. Inténtalo de nuevo.',
): NextResponse {
  console.error(`[${tag}] Error al cargar datos:`, err);
  return NextResponse.json({ error: message }, { status: 500 });
}
