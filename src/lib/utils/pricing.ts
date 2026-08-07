/**
 * Canonical pricing logic.
 *
 * ── Why this was rewritten ───────────────────────────────────────────────
 * The previous version treated `product.price` as already-final and used
 * `discounts[]` purely as a flag deciding whether to render sale styling,
 * gated on a manually-set `comparePrice`. That meant a Discount row created
 * in the admin changed nothing: with `comparePrice` null — which it is for
 * most products — `hasActiveSalePrice` returned false before it ever looked
 * at the discount, and no code path anywhere multiplied by `percentage`.
 *
 * A discount's `percentage` is now actually applied. `product.price` is the
 * pre-discount retail price; the effective price is derived from it.
 */
import type { ColorVariant, Discount, Product } from '@/types';

/**
 * A colour variant's prices, with inheritance resolved.
 *
 * A null `price` on a variant means "use the product's price", NOT zero — the
 * admin form leaves it blank for every colour that costs the same, which is
 * the common case. Same for wholesale. Resolving it in one place keeps that
 * rule out of the components.
 */
export function resolveVariantPricing(
  product: Product,
  variant: ColorVariant | null,
): Pick<Product, 'price' | 'wholesalePrice'> {
  if (!variant) {
    return { price: product.price, wholesalePrice: product.wholesalePrice };
  }
  return {
    price: variant.price ?? product.price,
    wholesalePrice: variant.wholesalePrice ?? product.wholesalePrice,
  };
}

/**
 * The product as priced for a chosen colour. Everything downstream
 * (`getEffectivePrice`, discounts, wholesale gating) then works unchanged,
 * because it only ever reads `price` / `wholesalePrice`.
 */
export function productForVariant(
  product: Product,
  variant: ColorVariant | null,
): Product {
  if (!variant) return product;
  return { ...product, ...resolveVariantPricing(product, variant) };
}

/** Stock for the chosen colour, or the product's own when there are none. */
export function getVariantStock(
  product: Product,
  variant: ColorVariant | null,
): number {
  return variant ? variant.stock : product.stock;
}

/**
 * A discount counts when it is switched on AND today falls inside its window.
 * Both bounds are optional and an absent bound means "unbounded on that side",
 * which is how the admin's blank date fields are meant to read.
 */
export function isDiscountActive(discount: Discount, now: Date = new Date()): boolean {
  if (!discount.active) return false;
  if (discount.percentage <= 0) return false;
  if (discount.startsAt && new Date(discount.startsAt) > now) return false;
  if (discount.endsAt && new Date(discount.endsAt) < now) return false;
  return true;
}

/**
 * The discount a product actually gets.
 *
 * Discounts do NOT stack: several could apply at once (a global sale plus a
 * category promo plus a one-off on the product), and multiplying them together
 * would compound into a discount nobody authored. The single deepest one wins,
 * which is both predictable and always the offer most favourable to the
 * shopper.
 *
 * `product.discounts` is expected to already contain every applicable scope —
 * see `attachScopedDiscounts` in the product repository, which merges the
 * GLOBAL and CATEGORY rows that the productId-based Prisma relation cannot
 * reach on its own.
 */
export function getBestActiveDiscount(
  product: Product,
  now: Date = new Date(),
): Discount | null {
  const applicable = product.discounts.filter((discount) =>
    isDiscountActive(discount, now),
  );
  if (applicable.length === 0) return null;

  return applicable.reduce((best, candidate) =>
    candidate.percentage > best.percentage ? candidate : best,
  );
}

export interface EffectivePrice {
  /** What the shopper actually pays. */
  final: number;
  /** Struck-through reference price, or null when there is nothing to strike. */
  original: number | null;
  /** The discount that produced `final`, when one applied. */
  discount: Discount | null;
  /** Whole percent off, for the badge. Null when no discount applied. */
  percentOff: number | null;
}

/**
 * Returns true when the product has a wholesale price configured by the
 * admin. Products created before this field existed have `wholesalePrice`
 * as null — this is expected, not a bug.
 */
export function hasWholesalePrice(product: Product): boolean {
  return typeof product.wholesalePrice === 'number' && product.wholesalePrice > 0;
}

/**
 * The base price for a given viewer, BEFORE any promotional discount.
 * Wholesale pricing only applies to approved wholesalers, and only when the
 * admin has set one — everyone else always sees `product.price`.
 */
export function getDisplayPrice(product: Product, isApprovedWholesaler: boolean): number {
  if (isApprovedWholesaler && hasWholesalePrice(product)) {
    return product.wholesalePrice as number;
  }
  return product.price;
}

/**
 * The full price picture for a viewer: what they pay, what to strike through,
 * and the badge percentage.
 *
 * ASSUMPTION worth knowing about: promotional discounts are NOT applied on top
 * of a wholesale price. A wholesale price is already a negotiated rate, and
 * silently compounding a public promo onto it would erode margin without the
 * admin ever asking for it. An approved wholesaler therefore sees their
 * wholesale price unchanged. Flip the `isApprovedWholesaler` guard below if
 * the business wants promos to stack for wholesalers too.
 */
export function getEffectivePrice(
  product: Product,
  isApprovedWholesaler = false,
  now: Date = new Date(),
): EffectivePrice {
  const base = getDisplayPrice(product, isApprovedWholesaler);

  const usingWholesale = isApprovedWholesaler && hasWholesalePrice(product);
  const discount = usingWholesale ? null : getBestActiveDiscount(product, now);

  if (discount) {
    // COP is not subdivided, so the result is whole pesos.
    const final = Math.round(base * (1 - discount.percentage / 100));
    return {
      final,
      original: base,
      discount,
      percentOff: Math.round(discount.percentage),
    };
  }

  /**
   * No discount row. `comparePrice` still drives a strikethrough on its own,
   * which is how a product marked down by hand (price lowered, comparePrice
   * left at the old value) keeps showing as a sale. This is the behaviour the
   * previous implementation had, preserved.
   */
  const comparePrice = product.comparePrice ?? null;
  const showsCompare =
    !usingWholesale && comparePrice !== null && comparePrice > base;

  return {
    final: base,
    original: showsCompare ? comparePrice : null,
    discount: null,
    percentOff: showsCompare
      ? Math.round(((comparePrice - base) / comparePrice) * 100)
      : null,
  };
}

/**
 * True when the product displays a reduced price — either from an active
 * Discount row or from a hand-set `comparePrice`.
 *
 * This is what the catalog's `?filter=descuento` matches on. Evaluated for the
 * retail viewer, so the Descuentos listing is the same for everyone.
 */
export function hasActiveSalePrice(product: Product, now: Date = new Date()): boolean {
  return getEffectivePrice(product, false, now).original !== null;
}

/**
 * Formats a Colombian peso price for display.
 * Example: 89000 → "$89.000"
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
