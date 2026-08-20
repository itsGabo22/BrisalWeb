/**
 * Per-colour stock resolution for an order line.
 *
 * HISTORICAL NOTE — this file is all that remains of the backorder
 * ("sobrepedido") feature, and it no longer does any backorder arithmetic.
 *
 * The story in three steps: orders could once be placed beyond stock, recording
 * the shortfall as `OrderItem.backorderQty`. That creation path was closed when
 * the client decided new orders must never oversell. `computeBackorderQty` then
 * survived briefly as a safety net in the admin confirm route — until stock
 * moved to being RESERVED at creation (`src/lib/orders/reservation.ts`), which
 * removed the confirm-time deduction entirely and left it with no caller. It is
 * gone; `OrderItem.backorderQty` stays in the schema because two real orders
 * carry non-zero values the client still needs to read.
 *
 * What is left, and what everything else now depends on, is the answer to one
 * question: WHICH stock row does this order line draw from? That is genuinely
 * shared — the order route reads it to pre-check, the reservation writes through
 * it, and the reject handler reads it again to give the units back — so it lives
 * here rather than being re-derived three times.
 *
 * The original design notes follow, because they still describe the colour
 * model this module reads.
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

