/**
 * Prices the cart for the current session.
 *
 * The cart stores the price each line had at add-to-cart time, which was fine
 * while price depended only on the product. It is not fine once a discount can
 * depend on HOW MANY units the cart holds: the shopper changes the quantity
 * from 4 to 5 and the stored line price is silently stale — and worse, stale in
 * the direction of not showing a discount they have just earned.
 *
 * So the cart asks the server. Same module the order route prices with
 * (`quoteCartLines`), so the figure on screen and the figure written to the
 * order are the same by construction. Nothing here is trusted for the order
 * itself — /api/ordenes re-quotes independently — this endpoint exists purely so
 * the display cannot drift from it.
 */
import { NextResponse } from 'next/server';

import { quoteCartLines } from '@/lib/pricing/quote';
import { cartQuoteSchema } from '@/lib/validators';
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';

export async function POST(request: Request) {
  /**
   * Reuses the coupon-validation bucket's shape of traffic: this fires when the
   * cart loads and on each quantity change, so the limit has to be generous,
   * but it does read product rows and resolve a session per call.
   */
  const ip = getClientIp(request);
  if (ip) {
    const limit = await checkRateLimit(RATE_LIMITS.cartQuote, `ip:${ip}`, ip);
    if (!limit.allowed) return rateLimitResponse(limit);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  const parsed = cartQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    const quote = await quoteCartLines(parsed.data.items);
    return NextResponse.json(quote);
  } catch (err) {
    console.error('[carrito/cotizar] Error al cotizar el carrito:', err);
    return NextResponse.json(
      { error: 'No se pudieron calcular los precios' },
      { status: 500 },
    );
  }
}
