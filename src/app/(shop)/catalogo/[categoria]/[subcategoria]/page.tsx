import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogContent } from '@/components/catalog/CatalogContent';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { SubcategoryChips } from '@/components/catalog/SubcategoryChips';
import {
  applyCatalogParams,
  buildColorFacets,
  buildMaterialFacets,
  getPriceBounds,
  paginateProducts,
  parseCatalogQuery,
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
  const query = parseCatalogQuery(await searchParams);

  const parentCategory = await categoryRepository.getBySlug(categoria);
  if (!parentCategory) notFound();

  const subCategory = await categoryRepository.getBySlug(subcategoria);
  if (!subCategory || subCategory.parentId !== parentCategory.id) notFound();

  const siblingSubcategories = await categoryRepository.getChildren(categoria);
  const products = await productRepository.getAll({
    subcategorySlug: subcategoria,
    active: true,
  });
  // A subcategory is a leaf: there is nothing left to narrow by category, so
  // that facet is empty here and CatalogFilters hides the section.
  const filtered = applyCatalogParams(products, query);
  const results = paginateProducts(filtered, query.page);

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
        results={results}
        categories={[]}
        colors={buildColorFacets(products)}
        materials={buildMaterialFacets(products)}
        priceBounds={getPriceBounds(products)}
      />
    </>
  );
}
