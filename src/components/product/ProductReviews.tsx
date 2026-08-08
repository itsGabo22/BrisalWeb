'use client';

import * as React from 'react';
import { CheckCircle2, MessageSquarePlus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Stars } from '@/components/ui/star-rating';
import { ReviewForm } from './ReviewForm';
import type { RatingSummary, Review } from '@/types';

interface ProductReviewsProps {
  productId: string;
  productName: string;
  /** APPROVED reviews only — the server never sends anything else here. */
  reviews: Review[];
  summary: RatingSummary;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Count per star value, highest first, for the distribution bars. */
function distribution(reviews: Review[]): { star: number; count: number }[] {
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));
}

export function ProductReviews({
  productId,
  productName,
  reviews,
  summary,
}: ProductReviewsProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  const hasReviews = summary.count > 0;
  const bars = React.useMemo(() => distribution(reviews), [reviews]);

  const handleSubmitted = () => {
    setIsFormOpen(false);
    setSubmitted(true);
  };

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      aria-labelledby="product-reviews-heading"
    >
      <div className="border-brand-line border-t pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="product-reviews-heading"
            className="text-brand-text font-heading text-xl font-medium"
          >
            Reseñas
          </h2>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2"
          >
            <MessageSquarePlus size={16} aria-hidden="true" />
            Escribir una reseña
          </Button>
        </div>

        {/* Confirmation lives here rather than inside the modal so it survives
            the modal closing — the shopper needs to be told the review is not
            live yet, and that message must not vanish with the dialog. */}
        {submitted && (
          <div
            className="border-brand-gold/40 bg-brand-gold/10 mt-6 flex items-start gap-3 rounded-lg border px-4 py-3"
            role="status"
          >
            <CheckCircle2
              size={18}
              className="text-brand-gold-deep mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-brand-gold-deep font-body text-sm leading-relaxed">
              ¡Gracias! Tu reseña será revisada antes de publicarse.
            </p>
          </div>
        )}

        {hasReviews ? (
          <>
            {/* ── Aggregate ─────────────────────────────── */}
            <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-center">
              <div className="flex shrink-0 flex-col items-center gap-1 sm:items-start">
                <span className="text-brand-text font-heading text-5xl font-medium tabular-nums">
                  {(summary.average ?? 0).toFixed(1)}
                </span>
                <Stars value={summary.average ?? 0} size="lg" />
                <span className="text-brand-text-soft font-body text-sm">
                  ({summary.count} {summary.count === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>

              <div className="w-full max-w-sm space-y-1.5">
                {bars.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-brand-text-soft w-8 shrink-0 font-body text-xs tabular-nums">
                      {star} ★
                    </span>
                    <span className="bg-brand-sand h-1.5 flex-1 overflow-hidden rounded-full">
                      <span
                        className="bg-brand-gold block h-full rounded-full"
                        style={{ width: `${(count / summary.count) * 100}%` }}
                      />
                    </span>
                    <span className="text-brand-text-soft w-6 shrink-0 text-right font-body text-xs tabular-nums">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Individual reviews ────────────────────── */}
            <ul className="mt-10 space-y-8">
              {reviews.map((review) => (
                <li key={review.id} className="border-brand-line border-t pt-6 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={review.rating} size="sm" />
                    <span className="text-brand-text font-body text-sm font-medium">
                      {review.authorName}
                    </span>
                    <span className="text-brand-text-soft/70 font-body text-xs">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {review.title && (
                    <h3 className="text-brand-text mt-2 font-body text-base font-medium">
                      {review.title}
                    </h3>
                  )}

                  {review.body && (
                    <p className="text-brand-text-soft mt-1.5 font-body text-sm leading-7 whitespace-pre-line">
                      {review.body}
                    </p>
                  )}

                  {review.imageUrls.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {review.imageUrls.map((url) => (
                        <li key={url}>
                          <button
                            type="button"
                            onClick={() => setLightbox(url)}
                            className="border-brand-line focus-visible:ring-brand-gold block size-20 overflow-hidden rounded-md border transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
                            aria-label={`Ampliar foto de la reseña de ${review.authorName}`}
                          >
                            {/* Customer uploads are already resized WebP in our
                                own bucket; next/image would re-optimize an
                                already-optimized file for no gain. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          /* Not an empty void: an unreviewed product still has to look
             finished, and the prompt is the only call to action here. */
          <div className="border-brand-line bg-brand-cream/60 mt-8 flex flex-col items-center rounded-lg border border-dashed px-6 py-12 text-center">
            <Stars value={0} size="lg" label="Sin reseñas todavía" />
            <p className="text-brand-text mt-4 font-body text-base font-medium">
              Sé el primero en dejar una reseña
            </p>
            <p className="text-brand-text-soft mt-1 max-w-sm font-body text-sm leading-relaxed">
              Cuéntale a otras clientas qué te pareció {productName}.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(true)}
              className="mt-5"
            >
              Escribir una reseña
            </Button>
          </div>
        )}
      </div>

      <ReviewForm
        productId={productId}
        productName={productName}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitted={handleSubmitted}
      />

      {lightbox && (
        <div
          className="bg-brand-text/80 fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Foto de la reseña"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
            className="absolute top-5 right-5 flex size-10 items-center justify-center rounded-full bg-white/90 text-brand-text transition-colors hover:bg-white"
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
