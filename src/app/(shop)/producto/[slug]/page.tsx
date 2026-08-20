import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductBreadcrumb, ProductReviews, RelatedProducts } from '@/components/product';
import { ProductDetail } from '@/components/product/ProductDetail';
import { prisma } from '@/lib/prisma';
import { productRepository } from '@/lib/repositories';
import { getFrequentlyBoughtTogether } from '@/lib/recommendations';
import { getApprovedReviews, getRatingSummary } from '@/lib/reviews';

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

  const [related, frequentlyBoughtTogether, reviews, ratingSummary, siteConfig] =
    await Promise.all([
      productRepository.getRelated(product, 4),
      getFrequentlyBoughtTogether(product.id, 4),
      // Both filter on APPROVED — a pending or rejected review must never reach
      // this page, and the aggregate must not count one either.
      getApprovedReviews(product.id),
      getRatingSummary(product.id),
      // One integer, joined into the batch the page already awaits, so the
      // low-stock nudge is server-rendered rather than popping in later.
      prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    ]);

  return (
    <main className="bg-brand-pearl">
      <ProductBreadcrumb product={product} />

      <ProductDetail
        product={product}
        lowStockThreshold={siteConfig?.lowStockThreshold}
      />

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

      <ProductReviews
        productId={product.id}
        productName={product.name}
        reviews={reviews}
        summary={ratingSummary}
      />

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
