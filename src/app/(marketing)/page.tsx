import type { Metadata } from 'next';

import {
  HeroSection,
  TrustBar,
  CategoryBar,
  BrandStatement,
  FeaturedProducts,
  WholesaleCallout,
} from '@/components/marketing';
import { categoryRepository, productRepository } from '@/lib/repositories';

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
  const [rootCategories, featuredProducts] = await Promise.all([
    categoryRepository.getTree(),
    productRepository.getFeatured(),
  ]);

  return (
    <>
      <HeroSection />
      <TrustBar />
      <CategoryBar categories={rootCategories} />
      <BrandStatement />
      <FeaturedProducts products={featuredProducts} />
      <WholesaleCallout />
    </>
  );
}
