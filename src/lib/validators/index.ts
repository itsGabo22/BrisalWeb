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
export const wholesaleSchema = z.object({
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
  email: z.string().email('Ingresa un correo electrónico válido'),
  telefono: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos'),
  ciudad: z
    .string()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(80, 'La ciudad no puede superar 80 caracteres'),
  mensaje: z
    .string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(800, 'El mensaje no puede superar 800 caracteres'),
});

export type WholesaleFormData = z.infer<typeof wholesaleSchema>;

// ─── Administrador ────────────────────────────────────────────────────────────

export const productVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre de la variante es requerido'),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  sku: z.string().optional().nullable(),
});


export const productAdminSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  comparePrice: z.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, 'Debes seleccionar una categoría'),
  sku: z.string().optional().nullable(),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  material: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).min(1, 'Debes agregar al menos una imagen'),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  variants: z.array(productVariantSchema).default([]),
  customAttributes: z.record(z.string(), z.string()).default({}),
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

