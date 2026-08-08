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
  label?: string | null;
  /** Percentage stored as a plain number on the client (0–100). */
  percentage: number;
  scope: 'GLOBAL' | 'CATEGORY' | 'PRODUCT';
  categoryId?: string | null;
  productId?: string | null;
  couponCode?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  active: boolean;
}

// ─── ColorVariant ─────────────────────────────────────────────────────────────
/**
 * One colour of a product. Replaces the old `ProductVariant`, which existed
 * only as a TypeScript shape — it had no table and `toProduct` never populated
 * it, so nothing ever read a real value out of it.
 */
export interface ColorVariant {
  id: string;
  colorName: string;
  /** Hex for the swatch, in the catalog filter and the product selector. */
  colorHex: string;
  imageUrls: string[];
  /** null = inherit the product's price. Not "free". */
  price?: number | null;
  /** null = inherit the product's wholesale price. */
  wholesalePrice?: number | null;
  stock: number;
  order: number;
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
  /** Wholesale tier price (mayoristas). No distributor tier — retail + wholesale only. */
  wholesalePrice?: number | null;
  sku?: string | null;
  stock: number;
  material?: string | null;
  /**
   * The PRIMARY colour, owned by the product itself. Its images, price and
   * stock are the product's own — no ColorVariant row is needed for it.
   */
  colorName?: string | null;
  colorHex?: string | null;
  /** Always `imageUrls`, never `images`. */
  imageUrls: string[];
  featured: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
  tags: Tag[];
  discounts: Discount[];
  /**
   * Colour variants, ordered by `order`. Empty for a simple product, which
   * keeps using the product-level `imageUrls`, `price` and `stock`.
   */
  colorVariants: ColorVariant[];
  /**
   * Aggregate over APPROVED reviews, attached by the repository in one extra
   * query per fetch — see `attachRatingSummaries`. Optional because a product
   * assembled outside the repository (tests, the admin form) has no reviews
   * loaded, and absent must read as "unknown", not as "zero stars".
   */
  rating?: RatingSummary;
}

// ─── CartItem ─────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
  /** Colour name chosen at add-to-cart time, when the product has variants. */
  color?: string | null;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * A shopper review. Reviewers are anonymous — Brisal has no general customer
 * login — so `authorName` is free text and there is no user link.
 */
export interface Review {
  id: string;
  productId: string;
  authorName: string;
  /** 1-5. */
  rating: number;
  title?: string | null;
  body?: string | null;
  imageUrls: string[];
  status: ReviewStatus;
  /** ISO string — this crosses the server/client boundary. */
  createdAt: string;
}

/** Aggregate over a product's APPROVED reviews only. */
export interface RatingSummary {
  /** Mean rating, or null when there is nothing approved yet. */
  average: number | null;
  count: number;
}

// ─── HeroSlide ────────────────────────────────────────────────────────────────
export interface HeroSlide {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  desktopUrl: string;
  mobileUrl?: string | null;
  posterUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaHref?: string | null;
  order: number;
  active: boolean;
  /**
   * Focal point as whole percentages (0-100), fed straight to CSS
   * object-position. Separate per breakpoint because a 16:9 desktop frame and
   * a 9:16 phone frame keep different parts of the same media. 50/50 is
   * centre — what object-cover does unaided — so slides created before this
   * existed behave identically.
   */
  desktopPosX?: number;
  desktopPosY?: number;
  mobilePosX?: number;
  mobilePosY?: number;
}

// ─── Wholesaler ───────────────────────────────────────────────────────────────
export type WholesalerStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface Wholesaler {
  id: string;
  nombre: string;
  negocio: string;
  nit: string;
  email: string;
  telefono: string;
  ciudad: string;
  mensaje?: string | null;
  fechaRegistro: string; // ISO date string
  estado: WholesalerStatus;
}
