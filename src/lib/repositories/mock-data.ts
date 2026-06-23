/**
 * Mock data for development — mirrors the shape of the Prisma models.
 * Replace this file's consumers with real repository implementations (Fase 3)
 * without touching any component.
 */
import type { Category, Tag, Discount, Product } from '@/types';

// ─── Categories ───────────────────────────────────────────────────────────────
export const CAT_ACCESORIOS: Category = {
  id: 'cat-accesorios',
  name: 'Accesorios',
  slug: 'accesorios',
  description: 'Colección completa de accesorios premium Brisal.',
  imageUrl: null,
  parentId: null,
};

export const CAT_ACERO: Category = {
  id: 'cat-acero',
  name: 'Acero',
  slug: 'acero',
  description: 'Accesorios de acero inoxidable de alta calidad.',
  imageUrl: null,
  parentId: 'cat-accesorios',
};

export const CAT_RODIO: Category = {
  id: 'cat-rodio',
  name: 'Rodio',
  slug: 'rodio',
  description: 'Accesorios bañados en rodio, durabilidad y brillo.',
  imageUrl: null,
  parentId: 'cat-accesorios',
};

// Attach children to the parent for tree queries
export const CAT_ACCESORIOS_WITH_CHILDREN: Category = {
  ...CAT_ACCESORIOS,
  children: [CAT_ACERO, CAT_RODIO],
};

// ─── Tags ─────────────────────────────────────────────────────────────────────
export const TAG_NUEVO: Tag = { id: 'tag-nuevo', name: 'Nuevo', slug: 'nuevo' };
export const TAG_MAS_VENDIDO: Tag = { id: 'tag-mas-vendido', name: 'Más vendido', slug: 'mas-vendido' };
export const TAG_EN_OFERTA: Tag = { id: 'tag-en-oferta', name: 'En oferta', slug: 'en-oferta' };
export const TAG_TENDENCIA: Tag = { id: 'tag-tendencia', name: 'Tendencia', slug: 'tendencia' };

export const ALL_TAGS: Tag[] = [TAG_NUEVO, TAG_MAS_VENDIDO, TAG_EN_OFERTA, TAG_TENDENCIA];

// ─── Discounts ────────────────────────────────────────────────────────────────
const DISCOUNT_COLLAR_ESLABONES: Discount = {
  id: 'disc-collar-eslabones',
  percentage: 20,
  scope: 'PRODUCT',
  productId: 'prod-collar-eslabones-acero',
  active: true,
  startsAt: null,
  endsAt: null,
};

const DISCOUNT_ANILLO_SELLO: Discount = {
  id: 'disc-anillo-sello',
  percentage: 15,
  scope: 'PRODUCT',
  productId: 'prod-anillo-sello-rodio',
  active: true,
  startsAt: null,
  endsAt: null,
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const MOCK_PRODUCTS: Product[] = [
  // ── ACERO (4 productos) ───────────────────────────────────────────────────
  {
    id: 'prod-collar-eslabones-acero',
    name: 'Collar Eslabones Acero',
    slug: 'collar-eslabones-acero',
    description:
      'Collar de eslabones gruesos en acero inoxidable 316L. Diseño minimalista de alto impacto.',
    price: 89000,
    comparePrice: 115000,
    sku: 'BSA-COL-001',
    stock: 12,
    material: 'Acero inoxidable 316L',
    imageUrls: [
      '/images/products/collar-eslabones-acero-1.jpg',
      '/images/products/collar-eslabones-acero-2.jpg',
    ],
    featured: true,
    active: true,
    categoryId: 'cat-acero',
    category: CAT_ACERO,
    tags: [TAG_EN_OFERTA, TAG_MAS_VENDIDO],
    discounts: [DISCOUNT_COLLAR_ESLABONES],
  },
  {
    id: 'prod-pulsera-tejida-acero',
    name: 'Pulsera Tejida Acero',
    slug: 'pulsera-tejida-acero',
    description:
      'Pulsera de cadena tejida en acero pulido. Cierre de langosta ajustable.',
    price: 65000,
    comparePrice: null,
    sku: 'BSA-PUL-001',
    stock: 8,
    material: 'Acero inoxidable',
    imageUrls: [
      '/images/products/pulsera-tejida-acero-1.jpg',
      '/images/products/pulsera-tejida-acero-2.jpg',
    ],
    featured: true,
    active: true,
    categoryId: 'cat-acero',
    category: CAT_ACERO,
    tags: [TAG_NUEVO],
    discounts: [],
  },
  {
    id: 'prod-aretes-argolla-acero',
    name: 'Aretes Argolla Acero',
    slug: 'aretes-argolla-acero',
    description: 'Argollas lisas de acero inoxidable, disponibles en 30 mm. Hipoalergénicas.',
    price: 48000,
    comparePrice: null,
    sku: 'BSA-ARE-001',
    stock: 20,
    material: 'Acero inoxidable',
    imageUrls: [
      '/images/products/aretes-argolla-acero-1.jpg',
      '/images/products/aretes-argolla-acero-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: 'cat-acero',
    category: CAT_ACERO,
    tags: [TAG_MAS_VENDIDO],
    discounts: [],
  },
  {
    id: 'prod-tobillera-doble-acero',
    name: 'Tobillera Doble Cadena Acero',
    slug: 'tobillera-doble-cadena-acero',
    description:
      'Tobillera con doble cadena fina en acero brillante. Perfecta para el verano.',
    price: 52000,
    comparePrice: null,
    sku: 'BSA-TOB-001',
    stock: 15,
    material: 'Acero inoxidable',
    imageUrls: [
      '/images/products/tobillera-doble-cadena-acero-1.jpg',
      '/images/products/tobillera-doble-cadena-acero-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: 'cat-acero',
    category: CAT_ACERO,
    tags: [TAG_TENDENCIA],
    discounts: [],
  },

  // ── RODIO (4 productos) ───────────────────────────────────────────────────
  {
    id: 'prod-collar-perla-rodio',
    name: 'Collar Perla Rodio',
    slug: 'collar-perla-rodio',
    description:
      'Collar con colgante de perla sintética en baño de rodio blanco. Elegancia atemporal.',
    price: 98000,
    comparePrice: null,
    sku: 'BSR-COL-001',
    stock: 6,
    material: 'Baño de rodio blanco',
    imageUrls: [
      '/images/products/collar-perla-rodio-1.jpg',
      '/images/products/collar-perla-rodio-2.jpg',
    ],
    featured: true,
    active: true,
    categoryId: 'cat-rodio',
    category: CAT_RODIO,
    tags: [TAG_NUEVO, TAG_TENDENCIA],
    discounts: [],
  },
  {
    id: 'prod-anillo-sello-rodio',
    name: 'Anillo Sello Rodio',
    slug: 'anillo-sello-rodio',
    description:
      'Anillo de sello rectangular bañado en rodio. Acabado brillante espejo.',
    price: 75000,
    comparePrice: 90000,
    sku: 'BSR-ANI-001',
    stock: 10,
    material: 'Baño de rodio',
    imageUrls: [
      '/images/products/anillo-sello-rodio-1.jpg',
      '/images/products/anillo-sello-rodio-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: 'cat-rodio',
    category: CAT_RODIO,
    tags: [TAG_EN_OFERTA],
    discounts: [DISCOUNT_ANILLO_SELLO],
  },
  {
    id: 'prod-pulsera-charm-rodio',
    name: 'Pulsera Charm Rodio',
    slug: 'pulsera-charm-rodio',
    description:
      'Pulsera delicada con tres charms de estrella bañados en rodio. Ligera y elegante.',
    price: 82000,
    comparePrice: null,
    sku: 'BSR-PUL-001',
    stock: 9,
    material: 'Baño de rodio',
    imageUrls: [
      '/images/products/pulsera-charm-rodio-1.jpg',
      '/images/products/pulsera-charm-rodio-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: 'cat-rodio',
    category: CAT_RODIO,
    tags: [TAG_MAS_VENDIDO],
    discounts: [],
  },
  {
    id: 'prod-aretes-gota-rodio',
    name: 'Aretes Gota Rodio',
    slug: 'aretes-gota-rodio',
    description:
      'Aretes en forma de gota alargada, baño de rodio y detalle de zirconia. Hipoalergénicos.',
    price: 68000,
    comparePrice: null,
    sku: 'BSR-ARE-001',
    stock: 14,
    material: 'Baño de rodio + zirconia',
    imageUrls: [
      '/images/products/aretes-gota-rodio-1.jpg',
      '/images/products/aretes-gota-rodio-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: 'cat-rodio',
    category: CAT_RODIO,
    tags: [TAG_TENDENCIA],
    discounts: [],
  },
];
