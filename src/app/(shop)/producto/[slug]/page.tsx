import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  ProductBreadcrumb,
  ProductGallery,
  ProductInfo,
  RelatedProducts,
} from '@/components/product';
import { productRepository } from '@/lib/repositories';

interface ProductoPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepository.getBySlug(slug);

  if (!product) {
    notFound();
  }

  const description =
    product.description ??
    `${product.name} - accesorio premium en ${product.material ?? product.category.name}`;
  const firstImage = product.imageUrls[0];

  return {
    title: `${product.name} | Brisal by Salvador`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: firstImage ? [firstImage] : [],
      type: 'website',
    },
  };
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const product = await productRepository.getBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = (
    await productRepository.getAll({
      categorySlug: product.category.slug,
      active: true,
    })
  )
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  return (
    <main className="bg-brand-pearl">
      <ProductBreadcrumb product={product} />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-14">
        <ProductGallery
          images={product.imageUrls}
          productName={product.name}
          className="lg:sticky lg:top-28 lg:self-start"
        />
        <ProductInfo product={product} />
      </section>

      {related.length > 0 && <RelatedProducts products={related} />}
    </main>
  );
}
