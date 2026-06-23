import { CatalogContent } from '@/components/catalog/CatalogContent';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import {
  filterProductsByTag,
  getUniqueTags,
  normalizeTagParam,
  type CatalogSearchParams,
} from '@/lib/catalog';
import { categoryRepository, productRepository } from '@/lib/repositories';

interface CatalogoPageProps {
  searchParams: CatalogSearchParams;
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const { tag } = await searchParams;
  const activeTagSlug = normalizeTagParam(tag);

  const allProducts = await productRepository.getAll({ active: true });
  const allTags = getUniqueTags(allProducts);
  const categories = await categoryRepository.getTree();
  const filteredProducts = filterProductsByTag(allProducts, activeTagSlug);

  return (
    <>
      <CatalogHeader
        title={'Cat\u00e1logo'}
        subtitle={'Toda nuestra colecci\u00f3n de accesorios'}
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Cat\u00e1logo' }]}
      />
      <CatalogContent
        products={filteredProducts}
        tags={allTags}
        categories={categories}
        activeTagSlug={activeTagSlug}
      />
    </>
  );
}
