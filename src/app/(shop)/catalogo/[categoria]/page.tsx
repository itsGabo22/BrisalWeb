import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogContent } from '@/components/catalog/CatalogContent';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { SubcategoryChips } from '@/components/catalog/SubcategoryChips';
import {
  filterProductsByTag,
  getUniqueTags,
  normalizeTagParam,
  type CatalogSearchParams,
} from '@/lib/catalog';
import { categoryRepository, productRepository } from '@/lib/repositories';

interface CategoriaPageProps {
  params: Promise<{
    categoria: string;
  }>;
  searchParams: CatalogSearchParams;
}

export async function generateMetadata({
  params,
}: CategoriaPageProps): Promise<Metadata> {
  const { categoria } = await params;
  const category = await categoryRepository.getBySlug(categoria);
  if (!category) notFound();

  return {
    title: `${category.name} | Brisal by Salvador`,
    description: category.description ?? `Colecci\u00f3n ${category.name} de Brisal`,
  };
}

export default async function CategoriaPage({
  params,
  searchParams,
}: CategoriaPageProps) {
  const { categoria } = await params;
  const { tag } = await searchParams;
  const activeTagSlug = normalizeTagParam(tag);

  const category = await categoryRepository.getBySlug(categoria);
  if (!category) notFound();

  const subcategories = await categoryRepository.getChildren(categoria);
  const products = await productRepository.getAll({
    categorySlug: categoria,
    active: true,
  });
  const filteredProducts = filterProductsByTag(products, activeTagSlug);
  const tags = getUniqueTags(products);
  const categories = await categoryRepository.getTree();

  return (
    <>
      <CatalogHeader
        title={category.name}
        subtitle={category.description ?? undefined}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Cat\u00e1logo', href: '/catalogo' },
          { label: category.name },
        ]}
      />
      <SubcategoryChips
        parentSlug={category.slug}
        subcategories={subcategories}
      />
      <CatalogContent
        products={filteredProducts}
        tags={tags}
        categories={categories}
        activeTagSlug={activeTagSlug}
      />
    </>
  );
}
