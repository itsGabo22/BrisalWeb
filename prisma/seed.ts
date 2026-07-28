import { prisma } from '../src/lib/prisma';

const BASE_TAGS = [
  { name: 'Acero', slug: 'acero' },
  { name: 'Rodio', slug: 'rodio' },
];

async function main() {
  await prisma.siteConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  for (const tag of BASE_TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  const [categoryCount, productCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);

  console.log(
    `Seed complete. SiteConfig ready, ${BASE_TAGS.length} base tags ensured. ` +
      `Existing data untouched: ${categoryCount} categories, ${productCount} products.`,
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
