import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Server-side coupon logic. Nothing here may run on the client: the Coupon
 * table has RLS enabled with NO select policy precisely so that a browser
 * cannot enumerate valid codes, and every check below must happen as the table
 * owner behind a route.
 */

/** One message for every failure mode, so a probe learns nothing from the text. */
export const INVALID_COUPON_MESSAGE = 'Cupón no válido o expirado.';

export interface AppliedCoupon {
  code: string;
  percentage: number;
  /** Pesos taken off the subtotal it was quoted against. */
  discountAmount: number;
}

/** Codes are stored uppercase, so matching is exact on the unique index. */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * The coupon's saving on a given subtotal.
 *
 * The subtotal handed in is ALREADY net of product-level Discounts — the cart
 * lines carry their discounted prices. A coupon therefore composes
 * sequentially rather than being added to the product discount: a 20%-off item
 * plus a 10% coupon is 0.9 × (0.8 × price) = 28% off, not 30%. Compounding the
 * two percentages would advertise a deeper discount than either was authored
 * to give.
 */
export function computeCouponDiscount(subtotal: number, percentage: number): number {
  if (subtotal <= 0 || percentage <= 0) return 0;
  // COP is not subdivided.
  return Math.round(subtotal * (percentage / 100));
}

export interface CouponLookup {
  id: string;
  code: string;
  percentage: number;
}

/**
 * Finds a coupon that is currently redeemable, or null.
 *
 * Every rejection returns null rather than a reason: telling a caller that a
 * code exists but is exhausted still confirms the code exists.
 */
export async function findRedeemableCoupon(
  rawCode: string,
  now: Date = new Date(),
): Promise<CouponLookup | null> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return null;

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return null;
  if (!coupon.active) return null;
  if (coupon.startsAt && coupon.startsAt > now) return null;
  if (coupon.endsAt && coupon.endsAt < now) return null;
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return null;

  return {
    id: coupon.id,
    code: coupon.code,
    percentage: coupon.percentage.toNumber(),
  };
}

/**
 * Claims one redemption, atomically.
 *
 * The check and the increment are ONE statement. Postgres takes a row lock for
 * the UPDATE, so two orders placed at the same instant on the last remaining
 * use serialize: the first matches the `usageCount < usageLimit` predicate and
 * increments, the second re-evaluates the predicate against the already
 * incremented row, matches nothing, and reports 0 rows affected.
 *
 * Doing this as a read-then-write — even inside a transaction at the default
 * READ COMMITTED level — would let both reads see the same count and both
 * writes succeed, overselling the coupon.
 *
 * The date and active checks are repeated here rather than trusted from the
 * earlier validate call: minutes can pass between a shopper applying a code
 * and submitting the order.
 *
 * @returns true when this caller got the redemption.
 */
export async function redeemCoupon(code: string, now: Date = new Date()): Promise<boolean> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return false;

  const affected = await prisma.$executeRaw(Prisma.sql`
    UPDATE "Coupon"
       SET "usageCount" = "usageCount" + 1,
           "updatedAt"  = ${now}
     WHERE "code" = ${normalized}
       AND "active" = true
       AND ("startsAt"   IS NULL OR "startsAt"   <= ${now})
       AND ("endsAt"     IS NULL OR "endsAt"     >= ${now})
       AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")
  `);

  return affected === 1;
}
