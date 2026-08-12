import { NextResponse } from 'next/server';
import { couponValidateSchema } from '@/lib/validators';
import {
  computeCouponDiscount,
  findRedeemableCoupon,
  INVALID_COUPON_MESSAGE,
} from '@/lib/coupons';

export const runtime = 'nodejs';

/**
 * Validates a coupon typed in the cart.
 *
 * This route exists because the client must never be able to read the Coupon
 * table — RLS denies it, so a browser cannot check a code for itself, let
 * alone enumerate the valid ones. It reports only whether THIS code works and
 * what it is worth.
 *
 * Note this does NOT claim a redemption: the shopper may never submit the
 * order. The usage counter moves only in the order route, under the atomic
 * guard in `redeemCoupon` — which re-checks everything below, because the code
 * can expire or run out between applying it and checking out.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  const parsed = couponValidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: INVALID_COUPON_MESSAGE }, { status: 400 });
  }

  const { code, subtotal } = parsed.data;

  try {
    const coupon = await findRedeemableCoupon(code);
    if (!coupon) {
      return NextResponse.json({ error: INVALID_COUPON_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({
      code: coupon.code,
      percentage: coupon.percentage,
      // Quoted against the subtotal the cart sent, which is already net of
      // product-level discounts. The order route recomputes it server-side
      // from the real line prices — this number is for display.
      discountAmount: computeCouponDiscount(subtotal, coupon.percentage),
    });
  } catch (err) {
    console.error('[cupones/validar] Error al validar cupón:', err);
    return NextResponse.json({ error: 'No se pudo validar el cupón' }, { status: 500 });
  }
}
