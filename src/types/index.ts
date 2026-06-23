/**
 * Shared TypeScript interfaces that mirror the Prisma schema models.
 * All client-side code imports types from this file — never inline types.
 *
 * IMPORTANT: `price` and `comparePrice` are `number` here because Prisma's
 * Decimal serializes to a plain string when passed over the wire (Server →
 * Client Components or API responses). Repositories / API handlers must
 * convert `new Prisma.Decimal(...)` → `Number(...)` before returning data
 * that flows into these interfaces.
 */

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  children?: Category[];
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
export interface Tag {
  id: string;
  name: string;
  slug: string;
}

// ─── Discount ─────────────────────────────────────────────────────────────────
export interface Discount {
  id: string;
  /** Percentage stored as a plain number on the client (0–100). */
  percentage: number;
  scope: 'GLOBAL' | 'CATEGORY' | 'PRODUCT';
  categoryId?: string | null;
  productId?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  active: boolean;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  /** Base selling price. */
  price: number;
  /**
   * Original/compare price shown struck-through.
   * If comparePrice > price AND at least one active PRODUCT-scoped discount
   * exists, the product is considered on sale. See `getEffectivePrice` in
   * src/lib/utils/pricing.ts for the canonical calculation.
   */
  comparePrice?: number | null;
  sku?: string | null;
  stock: number;
  material?: string | null;
  /** Always `imageUrls`, never `images`. */
  imageUrls: string[];
  featured: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
  tags: Tag[];
  discounts: Discount[];
}
