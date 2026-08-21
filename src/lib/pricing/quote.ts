/**
 * SERVER-SIDE price authority for a set of cart lines.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * Order creation used to compute its subtotal from the prices the CLIENT
 * posted: `items.reduce((sum, i) => sum + i.price * i.quantity, 0)`. The
 * comment above it said the total was "recomputed from the posted prices rather
 * than using the client's `total`", which is true and was still not enough —
 * the per-line prices themselves arrived from the browser, so anyone could post
 * whatever unit price they liked and the server would write it into the order
 * and quote it on WhatsApp.
 *
 * That was survivable while every shopper saw the same price. It stops being
 * survivable the moment a discount is scoped to WHOLESALERS or to a MINIMUM
 * QUANTITY: those are conditions a client can simply claim to meet. A
 * display-only check would let a logged-out shopper submit an order at the
 * wholesale-only price, or at the 5-unit price for a cart of one.
 *
 * So prices are derived here, from the database, for every caller:
 *   • the cart page, so what the shopper is shown is what they will be charged;
 *   • /api/ordenes, which uses these figures and IGNORES the posted ones.
 *
 * Both go through this one module, which is what makes "what you see" and "what
 * you are charged" the same number by construction rather than by coincidence.
 *
 * ── Wholesale status is never taken from the request ─────────────────────────
 * `wholesaleUserId` is posted by the client and is used only to STAMP the order
 * for the admin's records. Whether wholesale pricing applies comes from
 * `getSessionResult()` — the Supabase auth cookie plus the User row's
 * `approved` flag — so revoking a wholesaler (see `User.revokedAt`) stops their
 * pricing on the very next request, and a guest cannot obtain it by posting an
 * id.
 */
import { getSessionResult } from '@/lib/auth/wholesale-session';
import { resolveLineVariant } from '@/lib/orders/backorder';
import { productRepository } from '@/lib/repositories';
import {
  getEffectivePrice,
  productForVariant,
} from '@/lib/utils/pricing';
import type { Discount, Product } from '@/types';

/** A cart line as the client describes it. Prices are NOT accepted. */
export interface QuoteLineInput {
  productId: string;
  colorVariantId?: string | null;
  color?: string | null;
  quantity: number;
}

/** One line, priced by the server. */
export interface QuotedLine {
  productId: string;
  colorVariantId: string | null;
  color: string | null;
  quantity: number;
  /** What the shopper pays per unit. Authoritative. */
  unitPrice: number;
  /** Pre-discount unit price when the line is discounted, else null. */
  originalUnitPrice: number | null;
  /** The discount that produced `unitPrice`, for the cart's "por 5+" copy. */
  discountLabel: string | null;
  percentOff: number | null;
  /** False when the product no longer exists — the line cannot be priced. */
  found: boolean;
}

export interface CartQuote {
  lines: QuotedLine[];
  /** Sum of `unitPrice * quantity` over every found line, in whole pesos. */
  subtotal: number;
  /** Sum of what the product-level discounts took off. */
  savings: number;
  /** Whether the session pricing these lines is an approved wholesaler. */
  isApprovedWholesaler: boolean;
}

/**
 * Units in the cart counting toward each discount's `minQuantity`, keyed by
 * discount id.
 *
 * ── Granularity, and why ─────────────────────────────────────────────────────
 * The basis is "every unit in the cart that this discount reaches", which falls
 * out of one loop because `product.discounts` has already been resolved per
 * product by `attachScopedDiscounts`. That single rule gives the right answer
 * for all three scopes without special-casing any of them:
 *
 *   • PRODUCT-scoped  → units of the product(s) the campaign covers. Two
 *     COLOURS of the same product add up: 3 Dorado + 2 Plateado is five units
 *     of that product to a shopper, and splitting the threshold per colour
 *     would make "compra 5" unreachable on a multi-colour product for no
 *     reason the client could explain.
 *   • CATEGORY-scoped → units across the whole category (child categories
 *     included, matching how the discount was attached in the first place).
 *   • GLOBAL          → units across the entire cart.
 *
 * Per-LINE counting was the alternative and is rejected above. Note the cart
 * total is not the basis either: a 5-unit threshold on a Collares campaign is
 * about collares, not about buying five of anything.
 */
function qualifyingQuantities(
  lines: QuoteLineInput[],
  productsById: Map<string, Product>,
): Map<string, number> {
  const quantities = new Map<string, number>();

  for (const line of lines) {
    const product = productsById.get(line.productId);
    if (!product) continue;

    for (const discount of product.discounts) {
      quantities.set(discount.id, (quantities.get(discount.id) ?? 0) + line.quantity);
    }
  }

  return quantities;
}

/** The label to show for a discount, without leaking an empty string. */
function labelOf(discount: Discount | null): string | null {
  const label = discount?.label?.trim();
  return label ? label : null;
}

/**
 * Prices `lines` from the database, for the CURRENT session.
 *
 * `isApprovedWholesaler` may be supplied to skip the session lookup — the order
 * route resolves the session once and reuses it. Left absent, the session is
 * read here.
 */
export async function quoteCartLines(
  lines: QuoteLineInput[],
  options: { isApprovedWholesaler?: boolean; now?: Date } = {},
): Promise<CartQuote> {
  const now = options.now ?? new Date();

  const isApprovedWholesaler =
    options.isApprovedWholesaler ?? (await getSessionResult()).isApproved;

  if (lines.length === 0) {
    return { lines: [], subtotal: 0, savings: 0, isApprovedWholesaler };
  }

  const products = await productRepository.getByIds(lines.map((line) => line.productId));
  const productsById = new Map(products.map((product) => [product.id, product]));

  /**
   * Computed across the WHOLE cart before any line is priced: a line's price
   * can depend on how many units OTHER lines contribute toward the same
   * discount, so pricing line-by-line in isolation would get the first line
   * wrong.
   */
  const quantities = qualifyingQuantities(lines, productsById);

  const quoted: QuotedLine[] = lines.map((line) => {
    const product = productsById.get(line.productId);

    if (!product) {
      return {
        productId: line.productId,
        colorVariantId: line.colorVariantId ?? null,
        color: line.color ?? null,
        quantity: line.quantity,
        unitPrice: 0,
        originalUnitPrice: null,
        discountLabel: null,
        percentOff: null,
        found: false,
      };
    }

    // The same resolver stock reservation uses, so pricing and stock can never
    // disagree about which colour a line is.
    const variant = resolveLineVariant(product, line);
    const priced = getEffectivePrice(
      productForVariant(product, variant),
      isApprovedWholesaler,
      now,
      { quantities },
    );

    return {
      productId: product.id,
      colorVariantId: variant?.id ?? null,
      color: line.color ?? variant?.colorName ?? product.colorName ?? null,
      quantity: line.quantity,
      unitPrice: priced.final,
      originalUnitPrice: priced.original,
      discountLabel: labelOf(priced.discount),
      percentOff: priced.percentOff,
      found: true,
    };
  });

  const subtotal = quoted.reduce(
    (sum, line) => sum + (line.found ? line.unitPrice * line.quantity : 0),
    0,
  );
  const savings = quoted.reduce(
    (sum, line) =>
      sum +
      (line.found && line.originalUnitPrice !== null
        ? (line.originalUnitPrice - line.unitPrice) * line.quantity
        : 0),
    0,
  );

  return { lines: quoted, subtotal, savings, isApprovedWholesaler };
}
