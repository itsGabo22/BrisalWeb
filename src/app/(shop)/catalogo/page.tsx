import { CatalogContent } from '@/components/catalog/CatalogContent';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import {
  applyCatalogParams,
  getUniqueTags,
  normalizeFilterParam,
  normalizeSortParam,
  normalizeTagParam,
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
    subtitle: 'Lo \u00faltimo que ha llegado a Brisal',
  },
  descuento: {
    title: 'Descuentos',
    subtitle: 'Piezas con precio especial por tiempo limitado',
  },
  regalo: {
    title: 'Ideas para regalar',
    subtitle: 'Selecci\u00f3n pensada para sorprender',
  },
};

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const { tag, sort, filter } = await searchParams;
  const activeTagSlug = normalizeTagParam(tag);
  const activeSort = normalizeSortParam(sort);
  const activeFilter = normalizeFilterParam(filter);

  const allProducts = await productRepository.getAll({ active: true });
  const allTags = getUniqueTags(allProducts);
  const categories = await categoryRepository.getTree();
  const filteredProducts = applyCatalogParams(allProducts, {
    tagSlug: activeTagSlug,
    filter: activeFilter,
    sort: activeSort,
  });

  const heading =
    HEADINGS[activeSort ?? activeFilter ?? activeTagSlug ?? ''] ?? {
      title: 'Cat\u00e1logo',
      subtitle: 'Toda nuestra colecci\u00f3n de accesorios',
    };

  return (
    <>
      <CatalogHeader
        title={heading.title}
        subtitle={heading.subtitle}
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: heading.title }]}
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
