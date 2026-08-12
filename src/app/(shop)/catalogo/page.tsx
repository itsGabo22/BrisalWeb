import { CatalogContent } from '@/components/catalog/CatalogContent';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
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

interface CatalogoPageProps {
  searchParams: CatalogSearchParams;
}

// The intent nav points here with ?sort=nuevo, ?filter=descuento and
// ?tag=regalo. Each is normalized to a known value or dropped, so an
// unrecognised param degrades to the unfiltered catalog rather than erroring.
const HEADINGS: Record<string, { title: string; subtitle: string }> = {
  nuevo: {
    title: 'Novedades',
    subtitle: 'Lo último que ha llegado a Brisal',
  },
  descuento: {
    title: 'Descuentos',
    subtitle: 'Piezas con precio especial por tiempo limitado',
  },
  regalo: {
    title: 'Ideas para regalar',
    subtitle: 'Selección pensada para sorprender',
  },
};

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const query = parseCatalogQuery(await searchParams);

  const [allProducts, categories] = await Promise.all([
    productRepository.getAll({ active: true }),
    categoryRepository.getTree(),
  ]);

  // Facets are computed over the page's FULL scope, before filtering, so the
  // counts beside each checkbox stay stable as boxes are ticked rather than
  // collapsing toward zero.
  const categoryFacets = buildCategoryFacets(categories, allProducts);
  const colorFacets = buildColorFacets(allProducts);
  const materialFacets = buildMaterialFacets(allProducts);
  const priceBounds = getPriceBounds(allProducts);

  const filtered = applyCatalogParams(allProducts, query, categories);
  const results = paginateProducts(filtered, query.page);

  const heading =
    HEADINGS[query.sort ?? query.filter ?? query.tagSlug ?? ''] ?? {
      title: 'Catálogo',
      subtitle: 'Toda nuestra colección de accesorios',
    };

  return (
    <>
      <CatalogHeader
        title={heading.title}
        subtitle={heading.subtitle}
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: heading.title }]}
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
