'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  slug: string;
  /** Chosen colour, or null for a product without variants. */
  color?: string | null;
  /**
   * The reference at add-to-cart time. Carried on the line rather than looked
   * up later so the order records what the shopper was actually shown.
   */
  reference?: string | null;
}

/**
 * A cart line is identified by product AND colour, not product alone: the same
 * ring in Dorado and in Plateado are two different things to pick, pack and
 * ship, so they must not merge into one line or overwrite each other's
 * quantity.
 */
export function cartLineId(productId: string, color?: string | null): string {
  return `${productId}::${color ?? ''}`;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return Math.floor(quantity);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const quantityToAdd = normalizeQuantity(quantity);

        set((state) => {
          const lineId = cartLineId(item.productId, item.color);
          const existingItem = state.items.find(
            (cartItem) => cartLineId(cartItem.productId, cartItem.color) === lineId,
          );

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartLineId(cartItem.productId, cartItem.color) === lineId
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + quantityToAdd,
                    }
                  : cartItem,
              ),
            };
          }

          return {
            items: [...state.items, { ...item, quantity: quantityToAdd }],
          };
        });
      },
      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => cartLineId(item.productId, item.color) !== lineId,
          ),
        }));
      },
      updateQuantity: (lineId, quantity) => {
        const nextQuantity = normalizeQuantity(quantity);

        set((state) => ({
          items: state.items.map((item) =>
            cartLineId(item.productId, item.color) === lineId
              ? { ...item, quantity: nextQuantity }
              : item,
          ),
        }));
      },
      clearCart: () => {
        set({ items: [] });
      },
      getTotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),
      getItemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: 'brisal-cart',
      skipHydration: true,
    },
  ),
);
