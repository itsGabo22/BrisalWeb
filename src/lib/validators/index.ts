import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.number().positive('El precio debe ser un número positivo'),
  categoryId: z.string(),
});

// ─── Contacto ────────────────────────────────────────────────────────────────
export const contactSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede superar 80 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  telefono: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .optional()
    .or(z.literal('')),
  mensaje: z
    .string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(1000, 'El mensaje no puede superar 1000 caracteres'),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// ─── Mayoristas ───────────────────────────────────────────────────────────────
export const registroMayoristaSchema = z
  .object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80, 'El nombre no puede superar 80 caracteres'),
    /** Optional: not every wholesale applicant operates under a registered
     * business name. Matches the `telefono`-in-`contactSchema` idiom above --
     * `.optional()` alone only accepts `undefined`, and a blank controlled
     * input submits `''`, so `.or(z.literal(''))` is what actually lets an
     * empty field through. */
    nombreNegocio: z
      .string()
      .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
      .max(120, 'El nombre del negocio no puede superar 120 caracteres')
      .optional()
      .or(z.literal('')),
    nitCedula: z
      .string()
      .min(6, 'El NIT o cédula debe tener al menos 6 caracteres')
      .max(20, 'El NIT o cédula no puede superar 20 caracteres'),
    ciudad: z
      .string()
      .min(2, 'La ciudad debe tener al menos 2 caracteres')
      .max(80, 'La ciudad no puede superar 80 caracteres'),
    telefono: z
      .string()
      .min(7, 'El teléfono debe tener al menos 7 dígitos'),
    email: z.string().email('Ingresa un correo electrónico válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegistroMayoristaFormData = z.infer<typeof registroMayoristaSchema>;

export const mayoristaLoginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export type MayoristaLoginFormData = z.infer<typeof mayoristaLoginSchema>;

// ─── Administrador ────────────────────────────────────────────────────────────

/**
 * A colour variant as posted by the admin form.
 *
 * `price` / `wholesalePrice` are nullable on purpose: blank means "inherit the
 * product's price", which is the common case, and is resolved by
 * `resolveVariantPricing`. Up to 7 images per colour, matching the brief.
 */
export const colorVariantSchema = z.object({
  colorName: z.string().min(1, 'El nombre del color es requerido'),
  colorHex: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color inválido (usa #RRGGBB)'),
  imageUrls: z.array(z.string()).max(7, 'Máximo 7 imágenes por color').default([]),
  price: z.number().min(0).optional().nullable(),
  wholesalePrice: z.number().min(0).optional().nullable(),
  stock: z.number().min(0, 'El stock no puede ser negativo').default(0),
  order: z.number().int().min(0).default(0),
});

export type ColorVariantFormData = z.infer<typeof colorVariantSchema>;


export const productAdminSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  comparePrice: z.number().min(0).optional().nullable(),
  wholesalePrice: z.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, 'Debes seleccionar una categoría'),
  /**
   * Trimmed, and blank collapsed to `null`. `Product.sku` is `@unique`, and
   * Postgres treats every NULL as distinct while treating `''` as a real value
   * — so accepting an empty string meant the FIRST product saved without a SKU
   * claimed `''` and the second one failed on a unique violation. The form
   * already sends `null`, but the API must not depend on that.
   */
  sku: z
    .string()
    .optional()
    .nullable()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    }),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  material: z.string().optional().nullable(),
  colorName: z.string().optional().nullable(),
  colorHex: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).min(1, 'Debes agregar al menos una imagen'),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  description: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  /** Ids of every Material this product is made of. A piece can be several. */
  materialIds: z.array(z.string()).default([]),
  colorVariants: z.array(colorVariantSchema).default([]),
});

export type ProductAdminFormData = z.infer<typeof productAdminSchema>;

/**
 * Slug is optional on input: the routes derive it from the name when the admin
 * leaves it alone, and accept an override when they edit it.
 */
export const materialAdminSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().trim().optional().nullable(),
});

export type MaterialAdminFormData = z.infer<typeof materialAdminSchema>;

export const categoryAdminSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  /** Focal point (object-position), 0-100. Single point -- see the schema
   * comment on `Category.imagePosX` for why no desktop/mobile split. */
  imagePosX: z.number().int().min(0).max(100).optional(),
  imagePosY: z.number().int().min(0).max(100).optional(),
  /**
   * Blank collapsed to `null`, meaning "top-level category".
   *
   * `Category.parentId` is a foreign key, so an empty string is not "no parent"
   * to Postgres — it is a parent whose id is `''`, which no row has, and the
   * insert died on a FK violation reported as a generic 500. The multipart form
   * path normalises this in `parseCategoryFormData`, but a JSON caller went
   * straight through, so the rule belongs here where BOTH paths meet.
   */
  parentId: z
    .string()
    .optional()
    .nullable()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    }),
});

export type CategoryAdminFormData = z.infer<typeof categoryAdminSchema>;

/**
 * Accepts an ISO datetime, a plain `YYYY-MM-DD`, or empty/null meaning
 * "unbounded on this side" — which is how the admin's blank date inputs are
 * meant to read, and what `isDiscountActive` already interprets.
 */
const optionalDate = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  });

export const discountAdminSchema = z.object({
  label: z.string().min(2, 'La etiqueta debe tener al menos 2 caracteres'),
  percentage: z.number().min(1, 'El porcentaje debe ser al menos 1').max(100, 'El porcentaje no puede superar 100'),
  scope: z.enum(['GLOBAL', 'CATEGORY', 'PRODUCT']),
  categoryId: z.string().optional().nullable(),
  /** Every product a PRODUCT-scoped campaign covers. One campaign, many products. */
  productIds: z.array(z.string()).default([]),
  couponCode: z.string().optional().nullable(),
  startsAt: optionalDate,
  endsAt: optionalDate,
  active: z.boolean().default(true),
  /**
   * Defaults to ALL, so a payload from anywhere that does not know about this
   * field yet creates exactly the discount it used to.
   */
  audience: z.enum(['ALL', 'WHOLESALE_ONLY', 'RETAIL_ONLY']).default('ALL'),
  /**
   * Optional by design, and the default is genuinely absent — not 1.
   *
   * `null` means "no quantity requirement", which is how every existing
   * discount behaves and what the client wants for most campaigns. Empty
   * string and 0 both normalise to null as well: the admin's number input
   * yields '' when cleared, and a 0 threshold is meaningless (every cart line
   * has at least one unit), so accepting it as a real value would only create
   * discounts that look gated but are not.
   */
  minQuantity: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) return null;
      return Math.floor(parsed);
    }),
});

export type DiscountAdminFormData = z.infer<typeof discountAdminSchema>;

export const couponAdminSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(32, 'El código no puede superar 32 caracteres')
    // Stored uppercase so lookups can be case-insensitive without a functional
    // index, and so the admin list never shows the same code twice in
    // different casing.
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z0-9-]+$/.test(value), {
      message: 'Usa solo letras, números y guiones',
    }),
  percentage: z
    .number()
    .min(1, 'El porcentaje debe ser al menos 1')
    .max(100, 'El porcentaje no puede superar 100'),
  active: z.boolean().default(true),
  startsAt: optionalDate,
  endsAt: optionalDate,
  /** null = unlimited. */
  usageLimit: z.number().int().min(1, 'El límite debe ser al menos 1').optional().nullable(),
});

export type CouponAdminFormData = z.infer<typeof couponAdminSchema>;

/**
 * What the cart posts to /api/carrito/cotizar.
 *
 * Note what is NOT here: `price`. The whole point of the endpoint is that the
 * server derives prices, so accepting one would defeat it. Lines are identified
 * by product and colour, plus the quantity that decides whether a volume
 * discount applies.
 */
export const cartQuoteSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        colorVariantId: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        quantity: z.number().int().positive().max(9999),
      }),
    )
    .max(200),
});

/** What the cart posts to /api/cupones/validar. */
export const couponValidateSchema = z.object({
  code: z.string().trim().min(1, 'Escribe un código').max(32),
  /** Cart subtotal AFTER product-level discounts, in whole pesos. */
  subtotal: z.number().nonnegative(),
});

// ─── Órdenes ──────────────────────────────────────────────────────────────────
export const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  /**
   * IGNORED. The route re-derives every unit price from the database via
   * `quoteCartLines` — see the note there — so whatever arrives here has no
   * effect on what is charged or stored.
   *
   * Still accepted, and optional, purely so a browser holding the previous
   * bundle (or a cart persisted by it) does not get a 400 mid-checkout. Do not
   * read it.
   */
  price: z.number().nonnegative().optional(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  /**
   * Which ColorVariant the line is, so the server can read THAT colour's stock
   * when computing the backorder. Null/absent means the product's primary
   * colour — and is also what a cart persisted before this field existed sends,
   * which the server recovers from the colour name.
   *
   * `backorderQty` is deliberately NOT accepted from the client: the shopper
   * does not get to declare how much stock exists. The order route computes it.
   */
  colorVariantId: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'El carrito está vacío'),
  total: z.number().nonnegative(),
  customerName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre no puede superar 120 caracteres'),
  customerPhone: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono no puede superar 20 caracteres'),
  wholesaleUserId: z.string().optional().nullable(),
  /**
   * The coupon CODE only — never the amount. The route re-validates the code
   * and recomputes the discount from the line prices, so a tampered client
   * cannot award itself a bigger saving.
   */
  couponCode: z.string().trim().max(32).optional().nullable(),
});

export type CreateOrderData = z.infer<typeof createOrderSchema>;

// ─── Reseñas ──────────────────────────────────────────────────────────────────

/** Photos a shopper may attach to one review. */
export const MAX_REVIEW_IMAGES = 4;
export const MAX_REVIEW_BODY = 1500;

/**
 * A review as submitted from the product page.
 *
 * No login is required — Brisal has no general customer account — so this
 * validates shape only. The real defence is that every row is created PENDING
 * and an admin reads it before it is ever public. The limits here just stop the
 * obvious junk: an empty name, a rating outside 1-5, or an essay.
 */
export const createReviewSchema = z.object({
  productId: z.string().min(1, 'Producto inválido'),
  authorName: z
    .string()
    .trim()
    .min(2, 'Escribe tu nombre')
    .max(60, 'El nombre no puede superar 60 caracteres'),
  rating: z
    .number()
    .int('La calificación debe ser un número entero')
    .min(1, 'Selecciona de 1 a 5 estrellas')
    .max(5, 'Selecciona de 1 a 5 estrellas'),
  title: z.string().trim().max(120, 'El título no puede superar 120 caracteres').optional(),
  body: z
    .string()
    .trim()
    .max(MAX_REVIEW_BODY, `La reseña no puede superar ${MAX_REVIEW_BODY} caracteres`)
    .optional(),
});

export type CreateReviewData = z.infer<typeof createReviewSchema>;


// ─── Acciones admin sobre registros existentes ─────────────────────────────────

/**
 * The small JSON bodies the admin panel PATCHes at single records.
 *
 * These routes previously read `body as { action?: string }` and friends — a
 * cast, which asserts a shape without checking it. Each then guarded the value
 * against an allowlist, so they were not actually exploitable; what they lacked
 * was the uniform 400 and the single place to read what a route accepts. They
 * are behind the Supabase admin gate either way, so this is consistency and
 * legibility rather than a closed hole.
 *
 * `z.enum` rather than `z.string()` plus a manual check: the union IS the
 * validation, and it keeps the accepted values next to the type.
 */
export const orderActionSchema = z.object({
  action: z.enum(['confirm', 'reject']),
});

export const wholesalerStatusSchema = z.object({
  estado: z.enum(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REVOCADO']),
});

/**
 * Assigning a bandeja image to a product, or freeing it.
 *
 * `null` is a real, meaningful value here — "unassign this image" — which is
 * why it is nullable rather than optional. `undefined` (field absent) means the
 * same thing for this route, so both are accepted and normalised downstream.
 */
export const bandejaAssignSchema = z.object({
  productId: z.string().min(1).nullish(),
});
