/**
 * Mock data for development. It mirrors the shape of the Prisma models so
 * consumers can switch to real repositories in Fase 3 without component edits.
 */
import type { Category, Discount, Product, Tag } from '@/types';

// ─── Root Categories ──────────────────────────────────────────────────────────
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

export const CAT_PULSERAS: Category = {
  id: 'cat-pulseras',
  name: 'Pulseras',
  slug: 'pulseras',
  description: 'Pulseras delicadas para combinar en capas.',
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

export const CAT_PRENDEDORES: Category = {
  id: 'cat-prendedores',
  name: 'Prendedores',
  slug: 'prendedores',
  description: 'Prendedores para acentos elegantes y personales.',
  imageUrl: null,
  parentId: null,
};

export const CAT_ACCESORIOS: Category = {
  id: 'cat-accesorios',
  name: 'Accesorios',
  slug: 'accesorios',
  description: 'Accesorios y complementos premium.',
  imageUrl: null,
  parentId: null,
};

export const CAT_BELLEZA: Category = {
  id: 'cat-belleza',
  name: 'Belleza',
  slug: 'belleza',
  description: 'Cuidado personal, fragancias y maquillaje de lujo.',
  imageUrl: null,
  parentId: null,
};

// ─── Subcategories ────────────────────────────────────────────────────────────
// Aretes Subcategories
export const CAT_TOPITOS: Category = {
  id: 'sub-topitos',
  name: 'Topitos',
  slug: 'topitos',
  description: 'Topitos versátiles con brillo discreto.',
  imageUrl: null,
  parentId: CAT_ARETES.id,
};

export const CAT_ARETES_LARGOS: Category = {
  id: 'sub-aretes-largos',
  name: 'Aretes largos',
  slug: 'aretes-largos',
  description: 'Aretes largos para un look sofisticado.',
  imageUrl: null,
  parentId: CAT_ARETES.id,
};

export const CAT_ARETES_COLGANTES: Category = {
  id: 'sub-aretes-colgantes',
  name: 'Aretes colgantes',
  slug: 'aretes-colgantes',
  description: 'Aretes colgantes con movimiento elegante.',
  imageUrl: null,
  parentId: CAT_ARETES.id,
};

export const CAT_ARETES_ARGOLLA: Category = {
  id: 'sub-aretes-argolla',
  name: 'Aretes argolla',
  slug: 'aretes-argolla',
  description: 'Argollas clásicas y modernas de alta calidad.',
  imageUrl: null,
  parentId: CAT_ARETES.id,
};

export const CAT_EAR_CUFFS: Category = {
  id: 'sub-ear-cuffs',
  name: 'Ear cuffs',
  slug: 'ear-cuffs',
  description: 'Aros de presión modernos y elegantes.',
  imageUrl: null,
  parentId: CAT_ARETES.id,
};

// Collares Subcategories
export const CAT_GARGANTILLAS: Category = {
  id: 'sub-gargantillas',
  name: 'Gargantillas',
  slug: 'gargantillas',
  description: 'Collares cortos y gargantillas ajustadas.',
  imageUrl: null,
  parentId: CAT_COLLARES.id,
};

export const CAT_COLLARES_LARGOS: Category = {
  id: 'sub-collares-largos',
  name: 'Collares largos',
  slug: 'collares-largos',
  description: 'Collares largos ideales para combinar en capas.',
  imageUrl: null,
  parentId: CAT_COLLARES.id,
};

export const CAT_DIJES: Category = {
  id: 'sub-dijes',
  name: 'Dijes',
  slug: 'dijes',
  description: 'Dijes y colgantes exclusivos.',
  imageUrl: null,
  parentId: CAT_COLLARES.id,
};

// Pulseras Subcategories
export const CAT_PULSERAS_AJUSTABLES: Category = {
  id: 'sub-pulseras-ajustables',
  name: 'Pulseras ajustables',
  slug: 'pulseras-ajustables',
  description: 'Pulseras de tamaño adaptable.',
  imageUrl: null,
  parentId: CAT_PULSERAS.id,
};

export const CAT_PULSERAS_CON_DIJES: Category = {
  id: 'sub-pulseras-con-dijes',
  name: 'Pulseras con dijes',
  slug: 'pulseras-con-dijes',
  description: 'Pulseras decoradas con dijes y colgantes.',
  imageUrl: null,
  parentId: CAT_PULSERAS.id,
};

export const CAT_PULSERAS_RIGIDAS: Category = {
  id: 'sub-pulseras-rigidas',
  name: 'Pulseras rígidas',
  slug: 'pulseras-rigidas',
  description: 'Pulseras con estructura firme.',
  imageUrl: null,
  parentId: CAT_PULSERAS.id,
};

// Brazaletes Subcategories
export const CAT_BRAZALETES_ABIERTOS: Category = {
  id: 'sub-brazaletes-abiertos',
  name: 'Brazaletes abiertos',
  slug: 'brazaletes-abiertos',
  description: 'Brazaletes semicirculares ajustables.',
  imageUrl: null,
  parentId: CAT_BRAZALETES.id,
};

export const CAT_BRAZALETES_RIGIDOS: Category = {
  id: 'sub-brazaletes-rigidos',
  name: 'Brazaletes rígidos',
  slug: 'brazaletes-rigidos',
  description: 'Brazaletes rígidos y brazaletes cerrados.',
  imageUrl: null,
  parentId: CAT_BRAZALETES.id,
};

// Anillos Subcategories
export const CAT_ANILLOS_AJUSTABLES: Category = {
  id: 'sub-anillos-ajustables',
  name: 'Anillos ajustables',
  slug: 'anillos-ajustables',
  description: 'Anillos adaptables a cualquier medida.',
  imageUrl: null,
  parentId: CAT_ANILLOS.id,
};

export const CAT_SETS_DE_ANILLOS: Category = {
  id: 'sub-sets-de-anillos',
  name: 'Sets de anillos',
  slug: 'sets-de-anillos',
  description: 'Juegos de anillos para combinar.',
  imageUrl: null,
  parentId: CAT_ANILLOS.id,
};

// Prendedores Subcategories
export const CAT_PRENDEDORES_FLORALES: Category = {
  id: 'sub-florales',
  name: 'Florales',
  slug: 'florales',
  description: 'Prendedores con motivos florales y naturales.',
  imageUrl: null,
  parentId: CAT_PRENDEDORES.id,
};

export const CAT_PRENDEDORES_ELEGANTES: Category = {
  id: 'sub-elegantes',
  name: 'Elegantes',
  slug: 'elegantes',
  description: 'Prendedores clásicos para ocasiones especiales.',
  imageUrl: null,
  parentId: CAT_PRENDEDORES.id,
};

export const CAT_PRENDEDORES_TEMATICOS: Category = {
  id: 'sub-tematicos',
  name: 'Temáticos',
  slug: 'tematicos',
  description: 'Prendedores con diseños únicos y divertidos.',
  imageUrl: null,
  parentId: CAT_PRENDEDORES.id,
};

// Accesorios Subcategories
export const CAT_BANDANAS: Category = {
  id: 'sub-bandanas',
  name: 'Bandanas',
  slug: 'bandanas',
  description: 'Bandanas suaves para complementar el styling.',
  imageUrl: null,
  parentId: CAT_ACCESORIOS.id,
};

// Belleza Subcategories
export const CAT_CREMAS: Category = {
  id: 'sub-cremas',
  name: 'Cremas',
  slug: 'cremas',
  description: 'Cremas para rutinas de cuidado personal.',
  imageUrl: null,
  parentId: CAT_BELLEZA.id,
};

export const CAT_PERFUMES: Category = {
  id: 'sub-perfumes',
  name: 'Perfumes',
  slug: 'perfumes',
  description: 'Perfumes para dejar una firma elegante.',
  imageUrl: null,
  parentId: CAT_BELLEZA.id,
};

export const CAT_MAQUILLAJE: Category = {
  id: 'sub-maquillaje',
  name: 'Maquillaje',
  slug: 'maquillaje',
  description: 'Maquillaje seleccionado para acabados pulidos.',
  imageUrl: null,
  parentId: CAT_BELLEZA.id,
};

// ─── Grouping Lists ───────────────────────────────────────────────────────────
export const ROOT_CATEGORIES: Category[] = [
  CAT_ARETES,
  CAT_COLLARES,
  CAT_PULSERAS,
  CAT_BRAZALETES,
  CAT_ANILLOS,
  CAT_PRENDEDORES,
  CAT_ACCESORIOS,
  CAT_BELLEZA,
];

export const SUBCATEGORIES: Category[] = [
  CAT_TOPITOS,
  CAT_ARETES_LARGOS,
  CAT_ARETES_COLGANTES,
  CAT_ARETES_ARGOLLA,
  CAT_EAR_CUFFS,
  CAT_GARGANTILLAS,
  CAT_COLLARES_LARGOS,
  CAT_DIJES,
  CAT_PULSERAS_AJUSTABLES,
  CAT_PULSERAS_CON_DIJES,
  CAT_PULSERAS_RIGIDAS,
  CAT_BRAZALETES_ABIERTOS,
  CAT_BRAZALETES_RIGIDOS,
  CAT_ANILLOS_AJUSTABLES,
  CAT_SETS_DE_ANILLOS,
  CAT_PRENDEDORES_FLORALES,
  CAT_PRENDEDORES_ELEGANTES,
  CAT_PRENDEDORES_TEMATICOS,
  CAT_BANDANAS,
  CAT_CREMAS,
  CAT_PERFUMES,
  CAT_MAQUILLAJE,
];

export const ALL_CATEGORIES: Category[] = [
  ...ROOT_CATEGORIES,
  ...SUBCATEGORIES,
];

// ─── Tags ─────────────────────────────────────────────────────────────────────
// System Tags
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

// Material Tags
export const TAG_ACERO: Tag = { id: 'tag-acero', name: 'Acero', slug: 'acero' };
export const TAG_RODIO: Tag = { id: 'tag-rodio', name: 'Rodio', slug: 'rodio' };
export const TAG_PLATA: Tag = { id: 'tag-plata', name: 'Plata', slug: 'plata' };
export const TAG_ORO_LAMINADO: Tag = { id: 'tag-oro-laminado', name: 'Oro laminado', slug: 'oro-laminado' };
export const TAG_ACERO_INOXIDABLE: Tag = { id: 'tag-acero-inoxidable', name: 'Acero Inoxidable', slug: 'acero-inoxidable' };

// Color Tags
export const TAG_DORADO: Tag = { id: 'tag-dorado', name: 'Dorado', slug: 'dorado' };
export const TAG_PLATEADO: Tag = { id: 'tag-plateado', name: 'Plateado', slug: 'plateado' };
export const TAG_ROSE_GOLD: Tag = { id: 'tag-rose-gold', name: 'Rose Gold', slug: 'rose-gold' };

// Piedra Tags
export const TAG_CORNALINA: Tag = { id: 'tag-cornalina', name: 'Cornalina', slug: 'cornalina' };
export const TAG_PERLA: Tag = { id: 'tag-perla', name: 'Perla', slug: 'perla' };
export const TAG_ZIRCONIA: Tag = { id: 'tag-zirconia', name: 'Zirconia', slug: 'zirconia' };
export const TAG_CRISTAL: Tag = { id: 'tag-cristal', name: 'Cristal', slug: 'cristal' };

// Colección Tags
export const TAG_VERANO: Tag = { id: 'tag-verano', name: 'Verano', slug: 'verano' };
export const TAG_ELEGANCIA: Tag = { id: 'tag-elegancia', name: 'Elegancia', slug: 'elegancia' };
export const TAG_CASUAL: Tag = { id: 'tag-casual', name: 'Casual', slug: 'casual' };

// Precio Tags
export const TAG_PRECIO_MENOS_50000: Tag = {
  id: 'tag-precio-menos-50000',
  name: 'Menos de $50.000',
  slug: 'precio-menos-50000',
};
export const TAG_PRECIO_50000_100000: Tag = {
  id: 'tag-precio-50000-100000',
  name: '$50.000 - $100.000',
  slug: 'precio-50000-100000',
};
export const TAG_PRECIO_MAS_100000: Tag = {
  id: 'tag-precio-mas-100000',
  name: 'Más de $100.000',
  slug: 'precio-mas-100000',
};

export const ALL_TAGS: Tag[] = [
  TAG_NUEVO,
  TAG_MAS_VENDIDO,
  TAG_EN_OFERTA,
  TAG_TENDENCIA,
  TAG_ACERO,
  TAG_RODIO,
  TAG_PLATA,
  TAG_ORO_LAMINADO,
  TAG_ACERO_INOXIDABLE,
  TAG_DORADO,
  TAG_PLATEADO,
  TAG_ROSE_GOLD,
  TAG_CORNALINA,
  TAG_PERLA,
  TAG_ZIRCONIA,
  TAG_CRISTAL,
  TAG_VERANO,
  TAG_ELEGANCIA,
  TAG_CASUAL,
  TAG_PRECIO_MENOS_50000,
  TAG_PRECIO_50000_100000,
  TAG_PRECIO_MAS_100000,
];

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
    categoryId: CAT_GARGANTILLAS.id,
    category: CAT_GARGANTILLAS,
    tags: [TAG_ACERO, TAG_EN_OFERTA, TAG_MAS_VENDIDO, TAG_DORADO, TAG_PRECIO_50000_100000],
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
    material: 'Acero Inoxidable',
    imageUrls: [
      '/images/products/pulsera-tejida-acero-1.jpg',
      '/images/products/pulsera-tejida-acero-2.jpg',
    ],
    featured: true,
    active: true,
    categoryId: CAT_PULSERAS_AJUSTABLES.id,
    category: CAT_PULSERAS_AJUSTABLES,
    tags: [TAG_ACERO, TAG_NUEVO, TAG_ACERO_INOXIDABLE, TAG_PLATEADO, TAG_PRECIO_50000_100000],
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
    material: 'Acero Inoxidable',
    imageUrls: [
      '/images/products/aretes-argolla-acero-1.jpg',
      '/images/products/aretes-argolla-acero-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: CAT_ARETES_ARGOLLA.id,
    category: CAT_ARETES_ARGOLLA,
    tags: [TAG_ACERO, TAG_MAS_VENDIDO, TAG_ACERO_INOXIDABLE, TAG_PLATEADO, TAG_PRECIO_MENOS_50000],
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
    material: 'Acero Inoxidable',
    imageUrls: [
      '/images/products/tobillera-doble-cadena-acero-1.jpg',
      '/images/products/tobillera-doble-cadena-acero-2.jpg',
    ],
    featured: false,
    active: true,
    categoryId: CAT_BRAZALETES_RIGIDOS.id,
    category: CAT_BRAZALETES_RIGIDOS,
    tags: [TAG_ACERO, TAG_TENDENCIA, TAG_ACERO_INOXIDABLE, TAG_DORADO, TAG_PRECIO_50000_100000],
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
    tags: [TAG_RODIO, TAG_NUEVO, TAG_TENDENCIA, TAG_PERLA, TAG_PLATEADO, TAG_PRECIO_50000_100000],
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
    categoryId: CAT_ANILLOS_AJUSTABLES.id,
    category: CAT_ANILLOS_AJUSTABLES,
    tags: [TAG_RODIO, TAG_EN_OFERTA, TAG_PLATEADO, TAG_PRECIO_50000_100000],
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
    categoryId: CAT_PRENDEDORES_ELEGANTES.id,
    category: CAT_PRENDEDORES_ELEGANTES,
    tags: [TAG_RODIO, TAG_MAS_VENDIDO, TAG_PLATEADO, TAG_PRECIO_50000_100000],
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
    tags: [TAG_RODIO, TAG_TENDENCIA, TAG_ZIRCONIA, TAG_PLATEADO, TAG_PRECIO_50000_100000],
    discounts: [],
  },
];
