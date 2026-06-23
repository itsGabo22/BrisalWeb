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

interface SubcategoriaPageProps {
  params: Promise<{
    categoria: string;
    subcategoria: string;
  }>;
  searchParams: CatalogSearchParams;
}

export async function generateMetadata({
  params,
}: SubcategoriaPageProps): Promise<Metadata> {
  const { categoria, subcategoria } = await params;
  const parentCategory = await categoryRepository.getBySlug(categoria);
  if (!parentCategory) notFound();

  const subCategory = await categoryRepository.getBySlug(subcategoria);
  if (!subCategory || subCategory.parentId !== parentCategory.id) notFound();

  return {
    title: `${subCategory.name} | ${parentCategory.name} | Brisal by Salvador`,
    description:
      subCategory.description ?? `Accesorios ${subCategory.name} de Brisal`,
  };
}

export default async function SubcategoriaPage({
  params,
  searchParams,
}: SubcategoriaPageProps) {
  const { categoria, subcategoria } = await params;
  const { tag } = await searchParams;
  const activeTagSlug = normalizeTagParam(tag);

  const parentCategory = await categoryRepository.getBySlug(categoria);
  if (!parentCategory) notFound();

  const subCategory = await categoryRepository.getBySlug(subcategoria);
  if (!subCategory || subCategory.parentId !== parentCategory.id) notFound();

  const siblingSubcategories = await categoryRepository.getChildren(categoria);
  const products = await productRepository.getAll({
    subcategorySlug: subcategoria,
    active: true,
  });
  const filteredProducts = filterProductsByTag(products, activeTagSlug);
  const tags = getUniqueTags(products);
  const categories = await categoryRepository.getTree();

  return (
    <>
      <CatalogHeader
        title={subCategory.name}
        subtitle={subCategory.description ?? undefined}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Cat\u00e1logo', href: '/catalogo' },
          {
            label: parentCategory.name,
            href: `/catalogo/${parentCategory.slug}`,
          },
          { label: subCategory.name },
        ]}
      />
      <SubcategoryChips
        parentSlug={parentCategory.slug}
        subcategories={siblingSubcategories}
        activeSlug={subCategory.slug}
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
