import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogContent } from '@/components/catalog/CatalogContent';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { SubcategoryChips } from '@/components/catalog/SubcategoryChips';
import {
  applyCatalogParams,
  buildCategoryFacets,
  buildColorFacets,
  buildMaterialFacets,
  getPriceBounds,
  paginateProducts,
  parseCatalogQuery,
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
    description: category.description ?? `Colección ${category.name} de Brisal`,
  };
}

export default async function CategoriaPage({
  params,
  searchParams,
}: CategoriaPageProps) {
  const { categoria } = await params;
  const query = parseCatalogQuery(await searchParams);

  const category = await categoryRepository.getBySlug(categoria);
  if (!category) notFound();

  const [subcategories, products] = await Promise.all([
    categoryRepository.getChildren(categoria),
    productRepository.getAll({ categorySlug: categoria, active: true }),
  ]);

  /**
   * Inside a category, the Categoría facet lists that category's SUBcategories
   * rather than the whole tree — the shopper has already chosen "Aretes", so
   * offering "Collares" here would navigate them out of the page they are on.
   * Shaped as a single root so `expandCategorySlugs` and the facet builder
   * work unchanged.
   */
  const scopedTree = [{ ...category, children: subcategories }];
  const categoryFacets = buildCategoryFacets(scopedTree, products).flatMap(
    (facet) => facet.children,
  );
  const colorFacets = buildColorFacets(products);
  const materialFacets = buildMaterialFacets(products);
  const priceBounds = getPriceBounds(products);

  const filtered = applyCatalogParams(products, query, scopedTree);
  const results = paginateProducts(filtered, query.page);

  return (
    <>
      <CatalogHeader
        title={category.name}
        subtitle={category.description ?? undefined}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Catálogo', href: '/catalogo' },
          { label: category.name },
        ]}
      />
      <SubcategoryChips
        parentSlug={category.slug}
        subcategories={subcategories}
      />
      <CatalogContent
        results={results}
        categories={categoryFacets}
        colors={colorFacets}
        materials={materialFacets}
        priceBounds={priceBounds}
      />
    </>
  );
}
