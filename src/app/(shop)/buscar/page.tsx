import type { Metadata } from 'next';
import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { productRepository } from '@/lib/repositories';

interface BuscarPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: BuscarPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Resultados para "${q}"` : 'Buscar',
  };
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const products = query ? await productRepository.search(query) : [];

  return (
    <>
      <CatalogHeader
        title="Resultados de búsqueda"
        subtitle={query ? `"${query}"` : undefined}
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Buscar' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!query ? (
          <p className="py-24 text-center font-body text-sm text-brand-neutral-400">
            Escribe algo para buscar.
          </p>
        ) : (
          <ProductGrid
            products={products}
            emptyMessage={`No encontramos productos para "${query}".`}
          />
        )}
      </div>
    </>
  );
}
