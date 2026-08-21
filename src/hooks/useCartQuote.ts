'use client';

import * as React from 'react';

import { cartLineId, type CartItem } from '@/stores/cartStore';

/** One line as the server priced it. */
export interface QuotedCartLine {
  unitPrice: number;
  originalUnitPrice: number | null;
  discountLabel: string | null;
  percentOff: number | null;
  found: boolean;
}

export interface CartQuoteState {
  /** Server prices keyed by `cartLineId`, or null before the first response. */
  byLine: ReadonlyMap<string, QuotedCartLine> | null;
  subtotal: number | null;
  savings: number | null;
  isLoading: boolean;
}

interface QuoteResponse {
  lines: {
    productId: string;
    color: string | null;
    unitPrice: number;
    originalUnitPrice: number | null;
    discountLabel: string | null;
    percentOff: number | null;
    found: boolean;
  }[];
  subtotal: number;
  savings: number;
}

/** Small, so a shopper clicking + three times settles on one request. */
const DEBOUNCE_MS = 250;

/**
 * Re-prices the cart server-side whenever its contents or quantities change.
 *
 * ── Why the cart can no longer price itself ───────────────────────────────────
 * Cart lines store the price they had at add-to-cart time. That was sufficient
 * while a product's price was a property of the product. With volume discounts
 * it is not: going from 4 units to 5 can change the unit price, and no amount of
 * arithmetic on a stored number can discover that. Worse, the same is true of
 * wholesale-only campaigns, which depend on WHO is asking — something the
 * browser must not be the authority on.
 *
 * So the quantities go to the server and the prices come back. The same module
 * that prices the order (`quoteCartLines`) answers this, which is what makes the
 * cart's arithmetic and the order's agree.
 *
 * While a request is in flight the caller keeps showing the last known figures
 * — falling back to the store's own — so the cart never flashes empty prices.
 */
export function useCartQuote(items: CartItem[]): CartQuoteState {
  const [state, setState] = React.useState<CartQuoteState>({
    byLine: null,
    subtotal: null,
    savings: null,
    isLoading: false,
  });

  /**
   * The effect keys off this string, not off `items`. Zustand hands back a new
   * array identity on every store write, so depending on the array itself would
   * refetch on unrelated changes; and the only things that can move a price are
   * which lines exist and how many units each holds.
   */
  const signature = items
    .map((item) => `${item.productId}|${item.color ?? ''}|${item.colorVariantId ?? ''}|${item.quantity}`)
    .join(';');

  React.useEffect(() => {
    // Deferred through a microtask, matching how the rest of this codebase
    // updates state from an effect (see SearchOverlay): a synchronous setState
    // in an effect body triggers a cascading render and the lint rules reject
    // it.
    if (!signature) {
      void Promise.resolve().then(() =>
        setState({ byLine: null, subtotal: null, savings: null, isLoading: false }),
      );
      return;
    }

    let active = true;
    void Promise.resolve().then(() => setState((prev) => ({ ...prev, isLoading: true })));

    const payload = signature.split(';').map((entry) => {
      const [productId, color, colorVariantId, quantity] = entry.split('|');
      return {
        productId,
        color: color || null,
        colorVariantId: colorVariantId || null,
        quantity: Number(quantity),
      };
    });

    const timer = setTimeout(() => {
      void fetch('/api/carrito/cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      })
        .then((res) => (res.ok ? (res.json() as Promise<QuoteResponse>) : null))
        .then((data) => {
          if (!active || !data) {
            if (active) setState((prev) => ({ ...prev, isLoading: false }));
            return;
          }

          const byLine = new Map<string, QuotedCartLine>();
          data.lines.forEach((line, index) => {
            // Keyed by the same identity the cart uses for its own lines
            // (product + colour), taken from the request order so a line whose
            // product has vanished still lines up with its row.
            const source = payload[index];
            byLine.set(cartLineId(source.productId, source.color), {
              unitPrice: line.unitPrice,
              originalUnitPrice: line.originalUnitPrice,
              discountLabel: line.discountLabel,
              percentOff: line.percentOff,
              found: line.found,
            });
          });

          setState({
            byLine,
            subtotal: data.subtotal,
            savings: data.savings,
            isLoading: false,
          });
        })
        .catch(() => {
          // Leaves the previous figures in place — the cart falls back to the
          // stored prices, which is the behaviour it had before this hook.
          if (active) setState((prev) => ({ ...prev, isLoading: false }));
        });
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [signature]);

  return state;
}
