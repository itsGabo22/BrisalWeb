/**
 * Per-colour stock resolution for an order line.
 *
 * HISTORICAL NOTE — the backorder ("sobrepedido") CREATION path is gone. New
 * orders can no longer be placed beyond stock: `POST /api/ordenes` rejects such
 * a line with a 409 instead of recording a shortfall. What survives here is
 * used for two things that still matter:
 *
 *   • `resolveLineVariant` / `getAvailableStock` — reading the right colour's
 *     stock, which both the order route (to refuse an oversell) and the admin
 *     confirm route (to deduct from the right row) depend on.
 *   • `computeBackorderQty` — retained solely as the admin confirm route's
 *     safety net. With creation blocked it should now always come out 0, but
 *     `OrderItem.backorderQty` holds real history on existing orders and the
 *     floor-at-zero deduction is left exactly as it was rather than disturbed.
 *
 * The original design notes follow, because they still describe the colour
 * model this module reads.
 *
 * The one place that answers two questions about an order line:
 *
 *   1. Which colour is this line, so we know WHOSE stock to read?
 *   2. How many of it are beyond that stock right now?
 *
 * Stock lives per colour: the PRIMARY colour's stock is `Product.stock`, and
 * every additional colour has its own `ColorVariant.stock` (see
 * `src/lib/utils/product-options.ts`). A backorder is therefore always computed
 * against one specific colour, never against the product as a whole.
 *
 * Shared by the public order route (which now REFUSES a line beyond stock) and
 * the admin confirm route (which deducts what exists and floors at zero), so
 * the two can never disagree about which row a line points at.
 */
import type { ColorVariant, Product } from '@prisma/client';

/** The colour-identifying fields of a cart line or a stored OrderItem. */
export interface OrderLineColorRef {
  colorVariantId?: string | null;
  color?: string | null;
}

export type ProductWithVariants = Product & { colorVariants: ColorVariant[] };

/**
 * The ColorVariant an order line was placed in, or `null` for the product's
 * PRIMARY colour — whose stock is `Product.stock`, not a variant row.
 *
 * `colorVariantId` is authoritative when present. It is absent for two kinds of
 * line: the primary colour (correctly `null`), and carts that were persisted to
 * localStorage before the field existed, which carry only the colour NAME. The
 * name lookup recovers the right row for those. A name that matches nothing —
 * a variant renamed after the cart was filled — falls back to the primary
 * colour, which is what this code did for every line before Phase 5.
 */
export function resolveLineVariant(
  product: ProductWithVariants,
  line: OrderLineColorRef,
): ColorVariant | null {
  if (line.colorVariantId) {
    return product.colorVariants.find((variant) => variant.id === line.colorVariantId) ?? null;
  }

  const name = line.color?.trim().toLowerCase();
  if (!name) return null;
  if (product.colorName?.trim().toLowerCase() === name) return null;

  return (
    product.colorVariants.find(
      (variant) => variant.colorName.trim().toLowerCase() === name,
    ) ?? null
  );
}

/**
 * Units of this line's colour on hand, never negative — a stock column that has
 * somehow gone below zero is treated as empty rather than as a credit.
 */
export function getAvailableStock(
  product: ProductWithVariants,
  line: OrderLineColorRef,
): number {
  const variant = resolveLineVariant(product, line);
  return Math.max(0, variant ? variant.stock : product.stock);
}

/**
 * How many of `quantity` cannot be served from `available`.
 *
 * 0 means the line is fully in stock. Anything higher is what the client still
 * has to produce or restock, and is what gets flagged on WhatsApp and in the
 * admin.
 */
export function computeBackorderQty(quantity: number, available: number): number {
  return Math.max(0, quantity - Math.max(0, available));
}
