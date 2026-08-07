import type { Metadata } from 'next';

import {
  HeroSection,
  TrustBar,
  CategoryShowcase,
  BrandStatement,
  ProductShowcaseSection,
  WholesaleCallout,
  PromoPopup,
} from '@/components/marketing';
import { categoryRepository, productRepository } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';

const SHOWCASE_LIMIT = 8;

const PAGE_TITLE = 'Brisal by Salvador | Accesorios Premium en Acero y Rodio';
const PAGE_DESCRIPTION =
  'Descubre nuestra colección de accesorios en acero y rodio. Elegancia y calidad premium para cada ocasión.';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: PAGE_TITLE },
    description: PAGE_DESCRIPTION,
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      type: 'website',
    },
  };
}

export default async function HomePage() {
  const [rootCategories, newestProducts, bestSellers, heroSlides, promoPopup] = await Promise.all([
    categoryRepository.getTree(),
    productRepository.getAll({ active: true }),
    productRepository.getFeatured(),
    prisma.heroSlide.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.promoPopup.findUnique({ where: { id: 'singleton' } }),
  ]);

  return (
    <>
      <HeroSection slides={heroSlides} />
      <TrustBar />
      {/* Categorías is now the single category entry point on the homepage —
          the old CategoryBar icon strip that used to sit here was showing the
          same list twice. It rides directly under the hero, matching the
          reference, so the shape of the catalog is the first thing after the
          brand. Mobile keeps its own path via the drawer's Categorías
          accordion, which is unaffected by this removal. */}
      <CategoryShowcase categories={rootCategories} />
      <BrandStatement />
      <ProductShowcaseSection
        eyebrow="Recién llegado"
        title="Novedades"
        products={newestProducts.slice(0, SHOWCASE_LIMIT)}
        viewAllHref="/catalogo"
        tint="pearl"
      />
      <ProductShowcaseSection
        eyebrow="Los favoritos"
        title="Más Vendidos"
        products={bestSellers.slice(0, SHOWCASE_LIMIT)}
        viewAllHref="/catalogo"
        tint="warm"
      />
      <WholesaleCallout />
      <PromoPopup popup={promoPopup?.active ? promoPopup : null} />
    </>
  );
}
