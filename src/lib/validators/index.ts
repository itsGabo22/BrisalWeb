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
    nombreNegocio: z
      .string()
      .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
      .max(120, 'El nombre del negocio no puede superar 120 caracteres'),
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
  sku: z.string().optional().nullable(),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  material: z.string().optional().nullable(),
  colorName: z.string().optional().nullable(),
  colorHex: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).min(1, 'Debes agregar al menos una imagen'),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  description: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  colorVariants: z.array(colorVariantSchema).default([]),
});

export type ProductAdminFormData = z.infer<typeof productAdminSchema>;

export const categoryAdminSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export type CategoryAdminFormData = z.infer<typeof categoryAdminSchema>;

export const discountAdminSchema = z.object({
  label: z.string().min(2, 'La etiqueta debe tener al menos 2 caracteres'),
  percentage: z.number().min(1, 'El porcentaje debe ser al menos 1').max(100, 'El porcentaje no puede superar 100'),
  scope: z.enum(['GLOBAL', 'CATEGORY', 'PRODUCT']),
  categoryId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export type DiscountAdminFormData = z.infer<typeof discountAdminSchema>;

// ─── Órdenes ──────────────────────────────────────────────────────────────────
export const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
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
});

export type CreateOrderData = z.infer<typeof createOrderSchema>;

