/**
 * Canonical pricing logic for the client side.
 *
 * DECISION (documented for Fase 2.3 — product detail page):
 * ─────────────────────────────────────────────────────────
 * We use `comparePrice` as the "original price" display only.
 * The actual discounted price shown to the user is always `product.price`
 * (already the final price after any backend/admin discount was applied).
 *
 * `discounts[]` on a product are used ONLY to determine whether the sale UI
 * (struck-through comparePrice + gold price) should be rendered. The condition
 * is: comparePrice > price AND at least one Discount with
 * { scope: 'PRODUCT', active: true } exists in the product's discounts array.
 *
 * This avoids double-applying discounts: the backend is the single source of
 * truth for the final `price`; the frontend only decides *whether to show*
 * the sale treatment.
 *
 * In Fase 2.3 (product detail), reuse `hasActiveSalePrice` and display
 * the same struck/gold pattern — do NOT recompute the discount from percentage.
 */
import type { Product } from '@/types';

/**
 * Returns true when the product should display the "on sale" UI:
 * struck-through comparePrice + highlighted price.
 */
export function hasActiveSalePrice(product: Product): boolean {
  if (!product.comparePrice || product.comparePrice <= product.price) {
    return false;
  }
  return product.discounts.some(
    (d) => d.scope === 'PRODUCT' && d.active,
  );
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
