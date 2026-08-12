import type { Coupon, Discount } from '@/types';

/**
 * The four states a campaign can be in, as the admin list shows them.
 *
 * `active: false` and "expired" were previously collapsed into one Inactivo
 * badge, which made a switched-off discount and one that simply ran out of
 * time look identical — and only the second of those is fixed by renewing the
 * dates. "Programado" falls out of the same data and prevents the confusing
 * case where a discount exists, is switched on, and still isn't applying
 * because its start date hasn't arrived.
 */
export type DiscountState = 'ACTIVO' | 'PROGRAMADO' | 'EXPIRADO' | 'INACTIVO';

export function getDiscountState(
  discount: Pick<Discount, 'active' | 'startsAt' | 'endsAt'>,
  nowMs: number,
): DiscountState {
  // The manual switch wins: an admin who turned it off does not want to be
  // told it is merely expired.
  if (!discount.active) return 'INACTIVO';
  if (discount.endsAt && new Date(discount.endsAt).getTime() < nowMs) return 'EXPIRADO';
  if (discount.startsAt && new Date(discount.startsAt).getTime() > nowMs) return 'PROGRAMADO';
  return 'ACTIVO';
}

/** Coupons add "AGOTADO" — a usage limit reached is neither expiry nor a switch. */
export type CouponState = DiscountState | 'AGOTADO';

export function getCouponState(coupon: Coupon, nowMs: number): CouponState {
  if (!coupon.active) return 'INACTIVO';
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
    if (coupon.usageCount >= coupon.usageLimit) return 'AGOTADO';
  }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < nowMs) return 'EXPIRADO';
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > nowMs) return 'PROGRAMADO';
  return 'ACTIVO';
}

/** Tailwind classes per state, so both admin lists read identically. */
export const STATE_BADGE: Record<CouponState, string> = {
  ACTIVO:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  PROGRAMADO: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  EXPIRADO:
    'bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800',
  AGOTADO:
    'bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800',
  INACTIVO:
    'bg-brand-neutral-100 text-brand-neutral-600 dark:bg-brand-neutral-800 dark:text-brand-neutral-300',
};

export const STATE_LABEL: Record<CouponState, string> = {
  ACTIVO: 'Activo',
  PROGRAMADO: 'Programado',
  EXPIRADO: 'Expirado',
  AGOTADO: 'Agotado',
  INACTIVO: 'Inactivo',
};

/** `YYYY-MM-DD` for a date input, from an ISO string. */
export function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/**
 * Date-input value → an instant to store.
 *
 * `endsAt` is pushed to the end of the chosen day: an admin who types
 * "termina el 30 de junio" means the discount is live through the 30th, but a
 * bare `YYYY-MM-DD` parses to midnight, which would expire it a day early.
 */
export function fromDateInput(value: string, edge: 'start' | 'end'): string | null {
  if (!value) return null;
  return edge === 'start' ? `${value}T00:00:00` : `${value}T23:59:59`;
}
