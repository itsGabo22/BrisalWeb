/**
 * Mock data for development. It mirrors the shape of the Prisma models so
 * consumers can switch to real repositories in Fase 3 without component edits.
 */
import type { Category, Discount, Product, Tag } from '@/types';

// Categories
export const CAT_ARETES: Category = {
  id: 'cat-aretes',
  name: 'Aretes',
  slug: 'aretes',
  description: 'Aretes premium para elevar cualquier look.',
  imageUrl: null,
  parentId: null,
};

export const CAT_COLLARES: Category = {
  id: 'cat-collares',
  name: 'Collares',
  slug: 'collares',
  description: 'Collares de brillo sutil y presencia elegante.',
  imageUrl: null,
  parentId: null,
};

export const CAT_BRAZALETES: Category = {
  id: 'cat-brazaletes',
  name: 'Brazaletes',
  slug: 'brazaletes',
  description: 'Brazaletes con acabados pulidos y sofisticados.',
  imageUrl: null,
  parentId: null,
};

export const CAT_ANILLOS: Category = {
  id: 'cat-anillos',
  name: 'Anillos',
  slug: 'anillos',
  description: 'Anillos de diseño moderno para uso diario.',
  imageUrl: null,
  parentId: null,
};

export const CAT_PULSERAS: Category = {
  id: 'cat-pulseras',
  name: 'Pulseras',
  slug: 'pulseras',
  description: 'Pulseras delicadas para combinar en capas.',
  imageUrl: null,
  parentId: null,
};

export const CAT_TOPITOS: Category = {
  id: 'cat-topitos',
  name: 'Topitos',
  slug: 'topitos',
  description: 'Topitos versatiles con brillo discreto.',
  imageUrl: null,
  parentId: null,
};

export const CAT_PRENDEDORES: Category = {
  id: 'cat-prendedores',
  name: 'Prendedores',
  slug: 'prendedores',
  description: 'Prendedores para acentos elegantes y personales.',
  imageUrl: null,
  parentId: null,
};

export const CAT_BANDANAS: Category = {
  id: 'cat-bandanas',
  name: 'Bandanas',
  slug: 'bandanas',
  description: 'Bandanas suaves para complementar el styling.',
  imageUrl: null,
  parentId: null,
};

export const CAT_BELLEZA: Category = {
  id: 'cat-belleza',
  name: 'Belleza',
  slug: 'belleza',
  description: 'Cuidado personal, fragancias y maquillaje.',
  imageUrl: null,
  parentId: null,
};

export const CAT_CREMAS: Category = {
  id: 'cat-cremas',
  name: 'Cremas',
  slug: 'cremas',
  description: 'Cremas para rutinas de cuidado personal.',
  imageUrl: null,
  parentId: 'cat-belleza',
};

export const CAT_PERFUMES: Category = {
  id: 'cat-perfumes',
  name: 'Perfumes',
  slug: 'perfumes',
  description: 'Perfumes para dejar una firma elegante.',
  imageUrl: null,
  parentId: 'cat-belleza',
};

export const CAT_MAQUILLAJE: Category = {
  id: 'cat-maquillaje',
  name: 'Maquillaje',
  slug: 'maquillaje',
  description: 'Maquillaje seleccionado para acabados pulidos.',
  imageUrl: null,
  parentId: 'cat-belleza',
};

export const ROOT_CATEGORIES: Category[] = [
  CAT_ARETES,
  CAT_COLLARES,
  CAT_BRAZALETES,
  CAT_ANILLOS,
  CAT_PULSERAS,
  CAT_TOPITOS,
  CAT_PRENDEDORES,
  CAT_BANDANAS,
  CAT_BELLEZA,
];

export const SUBCATEGORIES: Category[] = [
  CAT_CREMAS,
  CAT_PERFUMES,
  CAT_MAQUILLAJE,
];

export const ALL_CATEGORIES: Category[] = [
  ...ROOT_CATEGORIES,
  ...SUBCATEGORIES,
];

// Tags
export const TAG_NUEVO: Tag = { id: 'tag-nuevo', name: 'Nuevo', slug: 'nuevo' };
export const TAG_MAS_VENDIDO: Tag = {
  id: 'tag-mas-vendido',
  name: 'Más vendido',
  slug: 'mas-vendido',
};
export const TAG_EN_OFERTA: Tag = {
  id: 'tag-en-oferta',
  name: 'En oferta',
  slug: 'en-oferta',
};
export const TAG_TENDENCIA: Tag = {
  id: 'tag-tendencia',
  name: 'Tendencia',
  slug: 'tendencia',
};
export const TAG_ACERO: Tag = { id: 'tag-acero', name: 'Acero', slug: 'acero' };
export const TAG_RODIO: Tag = { id: 'tag-rodio', name: 'Rodio', slug: 'rodio' };

export const ALL_TAGS: Tag[] = [
  TAG_NUEVO,
  TAG_MAS_VENDIDO,
  TAG_EN_OFERTA,
  TAG_TENDENCIA,
  TAG_ACERO,
  TAG_RODIO,
];

// Discounts
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

// Products
export const MOCK_PRODUCTS: Product[] = [
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
    categoryId: CAT_COLLARES.id,
    category: CAT_COLLARES,
    tags: [TAG_ACERO, TAG_EN_OFERTA, TAG_MAS_VENDIDO],
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
    categoryId: CAT_PULSERAS.id,
    category: CAT_PULSERAS,
    tags: [TAG_ACERO, TAG_NUEVO],
    discounts: [],
  },
  {
    id: 'prod-aretes-argolla-acero',
    name: 'Aretes Argolla Acero',
    slug: 'aretes-argolla-acero',
    description:
      'Argollas lisas de acero inoxidable, disponibles en 30 mm. Hipoalergénicas.',
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
    categoryId: CAT_ARETES.id,
    category: CAT_ARETES,
    tags: [TAG_ACERO, TAG_MAS_VENDIDO],
    discounts: [],
  },
  {
    id: 'prod-tobillera-doble-acero',
    name: 'Brazalete Doble Cadena Acero',
    slug: 'brazalete-doble-cadena-acero',
    description:
      'Brazalete con doble cadena fina en acero brillante. Perfecto para combinar.',
    price: 52000,
    comparePrice: null,
    sku: 'BSA-BRA-001',
    stock: 15,
    material: 'Acero inoxidable',
    imageUrls: [
      '/images/products/tobillera-doble-cadena-acero-1.jpg',
      '/images/products/tobillera-doble-cadena-acero-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: CAT_BRAZALETES.id,
    category: CAT_BRAZALETES,
    tags: [TAG_ACERO, TAG_TENDENCIA],
    discounts: [],
  },
  {
    id: 'prod-collar-perla-rodio',
    name: 'Topitos Perla Rodio',
    slug: 'topitos-perla-rodio',
    description:
      'Topitos con perla sintética y baño de rodio blanco. Elegancia atemporal.',
    price: 98000,
    comparePrice: null,
    sku: 'BSR-TOP-001',
    stock: 6,
    material: 'Baño de rodio blanco',
    imageUrls: [
      '/images/products/collar-perla-rodio-1.jpg',
      '/images/products/collar-perla-rodio-2.jpg',
    ],
    featured: true,
    active: true,
    categoryId: CAT_TOPITOS.id,
    category: CAT_TOPITOS,
    tags: [TAG_RODIO, TAG_NUEVO, TAG_TENDENCIA],
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
    categoryId: CAT_ANILLOS.id,
    category: CAT_ANILLOS,
    tags: [TAG_RODIO, TAG_EN_OFERTA],
    discounts: [DISCOUNT_ANILLO_SELLO],
  },
  {
    id: 'prod-pulsera-charm-rodio',
    name: 'Prendedor Charm Rodio',
    slug: 'prendedor-charm-rodio',
    description:
      'Prendedor delicado con charms de estrella bañados en rodio. Ligero y elegante.',
    price: 82000,
    comparePrice: null,
    sku: 'BSR-PRE-001',
    stock: 9,
    material: 'Baño de rodio',
    imageUrls: [
      '/images/products/pulsera-charm-rodio-1.jpg',
      '/images/products/pulsera-charm-rodio-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: CAT_PRENDEDORES.id,
    category: CAT_PRENDEDORES,
    tags: [TAG_RODIO, TAG_MAS_VENDIDO],
    discounts: [],
  },
  {
    id: 'prod-aretes-gota-rodio',
    name: 'Bandana Gota Rodio',
    slug: 'bandana-gota-rodio',
    description:
      'Bandana suave con dije en forma de gota, baño de rodio y detalle de zirconia.',
    price: 68000,
    comparePrice: null,
    sku: 'BSR-BAN-001',
    stock: 14,
    material: 'Baño de rodio + zirconia',
    imageUrls: [
      '/images/products/aretes-gota-rodio-1.jpg',
      '/images/products/aretes-gota-rodio-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: CAT_BANDANAS.id,
    category: CAT_BANDANAS,
    tags: [TAG_RODIO, TAG_TENDENCIA],
    discounts: [],
  },
];
