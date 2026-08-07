import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductBreadcrumb, RelatedProducts } from '@/components/product';
import { ProductDetail } from '@/components/product/ProductDetail';
import { productRepository } from '@/lib/repositories';
import { getFrequentlyBoughtTogether } from '@/lib/recommendations';

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

  const [related, frequentlyBoughtTogether] = await Promise.all([
    productRepository.getRelated(product, 4),
    getFrequentlyBoughtTogether(product.id, 4),
  ]);

  return (
    <main className="bg-brand-pearl">
      <ProductBreadcrumb product={product} />

      <ProductDetail product={product} />

      {/* Rendered only when the client actually wrote one — no empty
          "Descripción" heading on products without a description. */}
      {product.description && (
        <section
          className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8"
          aria-labelledby="product-description-heading"
        >
          <div className="border-brand-line max-w-3xl border-t pt-10">
            <h2
              id="product-description-heading"
              className="text-brand-text font-heading text-xl font-medium"
            >
              Descripción
            </h2>
            {/* whitespace-pre-line so paragraph breaks the client typed in the
                admin textarea survive without needing a rich-text editor. */}
            <p className="text-brand-text-soft mt-4 font-body text-base leading-8 whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </section>
      )}

      {frequentlyBoughtTogether && frequentlyBoughtTogether.length > 0 && (
        <RelatedProducts
          products={frequentlyBoughtTogether}
          title="Frecuentemente comprados juntos"
        />
      )}

      {related.length > 0 && <RelatedProducts products={related} />}
    </main>
  );
}
