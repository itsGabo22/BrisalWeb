import { prisma } from '../src/lib/prisma';

const BASE_TAGS = [
  { name: 'Acero', slug: 'acero' },
  { name: 'Rodio', slug: 'rodio' },
];

const ROOT_CATEGORIES = [
  { slug: 'aretes', name: 'Aretes', description: 'Aretes premium para elevar cualquier look.' },
  { slug: 'collares', name: 'Collares', description: 'Collares de brillo sutil y presencia elegante.' },
  { slug: 'pulseras', name: 'Pulseras', description: 'Pulseras delicadas para combinar en capas.' },
  { slug: 'brazaletes', name: 'Brazaletes', description: 'Brazaletes con acabados pulidos y sofisticados.' },
  { slug: 'anillos', name: 'Anillos', description: 'Anillos de diseño moderno para uso diario.' },
  { slug: 'prendedores', name: 'Prendedores', description: 'Prendedores para acentos elegantes y personales.' },
  { slug: 'accesorios', name: 'Accesorios', description: 'Accesorios y complementos premium.' },
  { slug: 'belleza', name: 'Belleza', description: 'Cuidado personal, fragancias y maquillaje de lujo.' },
];

const SUBCATEGORIES = [
  { slug: 'topitos', name: 'Topitos', description: 'Topitos versátiles con brillo discreto.', parentSlug: 'aretes' },
  { slug: 'aretes-largos', name: 'Aretes largos', description: 'Aretes largos para un look sofisticado.', parentSlug: 'aretes' },
  { slug: 'aretes-colgantes', name: 'Aretes colgantes', description: 'Aretes colgantes con movimiento elegante.', parentSlug: 'aretes' },
  { slug: 'aretes-argolla', name: 'Aretes argolla', description: 'Argollas clásicas y modernas de alta calidad.', parentSlug: 'aretes' },
  { slug: 'ear-cuffs', name: 'Ear cuffs', description: 'Aros de presión modernos y elegantes.', parentSlug: 'aretes' },
  { slug: 'gargantillas', name: 'Gargantillas', description: 'Collares cortos y gargantillas ajustadas.', parentSlug: 'collares' },
  { slug: 'collares-largos', name: 'Collares largos', description: 'Collares largos ideales para combinar en capas.', parentSlug: 'collares' },
  { slug: 'dijes', name: 'Dijes', description: 'Dijes y colgantes exclusivos.', parentSlug: 'collares' },
  { slug: 'pulseras-ajustables', name: 'Pulseras ajustables', description: 'Pulseras de tamaño adaptable.', parentSlug: 'pulseras' },
  { slug: 'pulseras-con-dijes', name: 'Pulseras con dijes', description: 'Pulseras decoradas con dijes y colgantes.', parentSlug: 'pulseras' },
  { slug: 'pulseras-rigidas', name: 'Pulseras rígidas', description: 'Pulseras con estructura firme.', parentSlug: 'pulseras' },
  { slug: 'brazaletes-abiertos', name: 'Brazaletes abiertos', description: 'Brazaletes semicirculares ajustables.', parentSlug: 'brazaletes' },
  { slug: 'brazaletes-rigidos', name: 'Brazaletes rígidos', description: 'Brazaletes rígidos y brazaletes cerrados.', parentSlug: 'brazaletes' },
  { slug: 'anillos-ajustables', name: 'Anillos ajustables', description: 'Anillos adaptables a cualquier medida.', parentSlug: 'anillos' },
  { slug: 'sets-de-anillos', name: 'Sets de anillos', description: 'Juegos de anillos para combinar.', parentSlug: 'anillos' },
  { slug: 'florales', name: 'Florales', description: 'Prendedores con motivos florales y naturales.', parentSlug: 'prendedores' },
  { slug: 'elegantes', name: 'Elegantes', description: 'Prendedores clásicos para ocasiones especiales.', parentSlug: 'prendedores' },
  { slug: 'tematicos', name: 'Temáticos', description: 'Prendedores con diseños únicos y divertidos.', parentSlug: 'prendedores' },
  { slug: 'bandanas', name: 'Bandanas', description: 'Bandanas suaves para complementar el styling.', parentSlug: 'accesorios' },
  { slug: 'cremas', name: 'Cremas', description: 'Cremas para rutinas de cuidado personal.', parentSlug: 'belleza' },
  { slug: 'perfumes', name: 'Perfumes', description: 'Perfumes para dejar una firma elegante.', parentSlug: 'belleza' },
  { slug: 'maquillaje', name: 'Maquillaje', description: 'Maquillaje seleccionado para acabados pulidos.', parentSlug: 'belleza' },
];

const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';

const DEMO_PRODUCTS = [
  {
    slug: 'collar-eslabones-acero',
    name: 'Collar Eslabones Acero',
    description: 'Collar de eslabones gruesos en acero inoxidable 316L. Diseño minimalista de alto impacto.',
    price: 89000,
    comparePrice: 115000,
    sku: 'BSA-COL-001',
    stock: 12,
    material: 'Acero inoxidable 316L',
    categorySlug: 'gargantillas',
    featured: true,
    tagSlugs: ['acero'],
  },
  {
    slug: 'pulsera-tejida-acero',
    name: 'Pulsera Tejida Acero',
    description: 'Pulsera de cadena tejida en acero pulido. Cierre de langosta ajustable.',
    price: 65000,
    comparePrice: null,
    sku: 'BSA-PUL-001',
    stock: 8,
    material: 'Acero Inoxidable',
    categorySlug: 'pulseras-ajustables',
    featured: true,
    tagSlugs: ['acero'],
  },
  {
    slug: 'aretes-argolla-acero',
    name: 'Aretes Argolla Acero',
    description: 'Argollas lisas de acero inoxidable, disponibles en 30 mm. Hipoalergénicas.',
    price: 48000,
    comparePrice: null,
    sku: 'BSA-ARE-001',
    stock: 20,
    material: 'Acero Inoxidable',
    categorySlug: 'aretes-argolla',
    featured: false,
    tagSlugs: ['acero'],
  },
  {
    slug: 'brazalete-doble-cadena-acero',
    name: 'Brazalete Doble Cadena Acero',
    description: 'Brazalete con doble cadena fina en acero brillante. Perfecto para combinar.',
    price: 52000,
    comparePrice: null,
    sku: 'BSA-BRA-001',
    stock: 15,
    material: 'Acero Inoxidable',
    categorySlug: 'brazaletes-rigidos',
    featured: false,
    tagSlugs: ['acero'],
  },
  {
    slug: 'anillo-sello-bano-rodio',
    name: 'Anillo Sello Baño de Rodio',
    description: 'Anillo sello con baño de rodio, acabado espejo. Tamaño ajustable.',
    price: 55000,
    comparePrice: null,
    sku: 'BSA-ANI-001',
    stock: 10,
    material: 'Baño de rodio',
    categorySlug: 'anillos-ajustables',
    featured: true,
    tagSlugs: ['rodio'],
  },
  {
    slug: 'prendedor-floral-elegante',
    name: 'Prendedor Floral Elegante',
    description: 'Prendedor con motivo floral en acero pulido, ideal para blazers y abrigos.',
    price: 38000,
    comparePrice: null,
    sku: 'BSA-PRE-001',
    stock: 18,
    material: 'Acero',
    categorySlug: 'florales',
    featured: false,
    tagSlugs: ['acero'],
  },
  {
    slug: 'set-anillos-minimalista',
    name: 'Set Anillos Minimalista',
    description: 'Set de 3 anillos finos apilables en acero inoxidable.',
    price: 60000,
    comparePrice: 72000,
    sku: 'BSA-ANI-002',
    stock: 14,
    material: 'Acero Inoxidable',
    categorySlug: 'sets-de-anillos',
    featured: false,
    tagSlugs: ['acero'],
  },
];

async function main() {
  await prisma.siteConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  const tagIds = new Map<string, string>();
  for (const tag of BASE_TAGS) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
    tagIds.set(tag.slug, created.id);
  }

  const rootIds = new Map<string, string>();
  for (const root of ROOT_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: root.slug },
      update: {},
      create: { name: root.name, slug: root.slug, description: root.description },
    });
    rootIds.set(root.slug, category.id);
  }

  const subIds = new Map<string, string>();
  for (const sub of SUBCATEGORIES) {
    const parentId = rootIds.get(sub.parentSlug);
    if (!parentId) continue;
    const category = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: {
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        parentId,
      },
    });
    subIds.set(sub.slug, category.id);
  }

  let productsCreated = 0;
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    for (const product of DEMO_PRODUCTS) {
      const categoryId = subIds.get(product.categorySlug);
      if (!categoryId) continue;

      await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          comparePrice: product.comparePrice,
          sku: product.sku,
          stock: product.stock,
          material: product.material,
          imageUrls: [PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE],
          featured: product.featured,
          active: true,
          categoryId,
          tags: {
            create: product.tagSlugs
              .map((slug) => tagIds.get(slug))
              .filter((tagId): tagId is string => Boolean(tagId))
              .map((tagId) => ({ tagId })),
          },
        },
      });
      productsCreated += 1;
    }
  }

  const [categoryCount, finalProductCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);

  console.log(
    `Seed complete. SiteConfig ready, ${BASE_TAGS.length} base tags ensured, ` +
      `${categoryCount} categories ensured, ${productsCreated} demo products created ` +
      `(${finalProductCount} total products in DB).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
