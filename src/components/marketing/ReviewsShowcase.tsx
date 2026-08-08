'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

import { Stars } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import type { ShowcaseReview } from '@/lib/reviews';

interface ReviewsShowcaseProps {
  reviews: ShowcaseReview[];
}

/**
 * Decorative gold blooms behind the glass.
 *
 * Two low-alpha radial washes rather than one, offset from each other, so the
 * frosting has something with structure to blur — a flat tint blurs to itself
 * and the cards stop reading as glass. `pointer-events-none` and aria-hidden:
 * this layer is texture, not content.
 *
 * The drift is a CSS keyframe on transform only, gated behind `motion-safe`,
 * and deliberately NOT `background-attachment: fixed` — iOS Safari ignores
 * that property and renders a backdrop that jumps on every scroll frame.
 */
function GoldGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-24 -left-16 h-[26rem] w-[26rem] rounded-full opacity-70 motion-safe:animate-[brisal-glow-drift_14s_ease-in-out_infinite]"
        style={{
          background:
            'radial-gradient(circle, rgba(201,169,110,0.22) 0%, rgba(201,169,110,0.08) 45%, transparent 70%)',
        }}
      />
      <div
        className="absolute -right-20 -bottom-28 h-[30rem] w-[30rem] rounded-full opacity-60 motion-safe:animate-[brisal-glow-drift_18s_ease-in-out_infinite_reverse]"
        style={{
          background:
            'radial-gradient(circle, rgba(201,169,110,0.18) 0%, rgba(240,233,224,0.35) 45%, transparent 72%)',
        }}
      />
    </div>
  );
}

function ReviewCard({
  review,
  index,
  reducedMotion,
}: {
  review: ShowcaseReview;
  index: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.li
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      // `once` so the cards don't re-animate every time the band scrolls back
      // into view, which reads as a glitch rather than as polish.
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: reducedMotion ? 0.01 : 0.55,
        delay: reducedMotion ? 0 : index * 0.09,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'review-glass flex w-[85vw] shrink-0 snap-center flex-col rounded-2xl p-6 sm:w-[22rem] md:w-auto',
        // Hover lift is pointer-only: on a touch device :hover sticks after a
        // tap and leaves a card floating for no reason.
        'transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-1.5',
      )}
    >
      <Stars value={review.rating} size="md" />

      {review.title && (
        <p className="text-brand-text mt-3 font-body text-base font-medium">
          {review.title}
        </p>
      )}

      <blockquote className="text-brand-text-soft mt-2 flex-1 font-body text-sm leading-7">
        {review.body}
      </blockquote>

      <div className="border-brand-line/70 mt-5 flex items-center gap-3 border-t pt-4">
        {review.imageUrls[0] && (
          <span className="border-brand-line size-11 shrink-0 overflow-hidden rounded-full border">
            {/* Customer uploads are already resized WebP in our own bucket, so
                next/image would re-optimize an optimized file for no gain. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={review.imageUrls[0]} alt="" className="h-full w-full object-cover" />
          </span>
        )}
        <span className="min-w-0">
          <span className="text-brand-text block font-body text-sm font-medium">
            {review.authorName}
          </span>
          <Link
            href={`/producto/${review.productSlug}`}
            className="text-brand-gold-deep hover:text-brand-gold focus-visible:ring-brand-gold block truncate rounded-sm font-body text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {review.productName}
          </Link>
        </span>
      </div>
    </motion.li>
  );
}

/**
 * The homepage testimonials band, directly above the footer.
 *
 * Layout is a responsive hybrid rather than one mechanism: a snap-scrolling
 * swipe strip below `md`, a three-up grid at and above it. That gives the
 * mobile swipe the brief asks for while letting a desktop visitor take in
 * every quote at once — and it avoids an auto-advancing carousel, which moves
 * text out from under someone who is still reading it.
 *
 * Renders nothing at all when there is too little to show; the caller decides
 * the threshold via `SHOWCASE_MIN_REVIEWS`.
 */
export function ReviewsShowcase({ reviews }: ReviewsShowcaseProps) {
  const reducedMotion = Boolean(useReducedMotion());

  if (reviews.length === 0) return null;

  return (
    <section
      className="bg-brand-cream relative overflow-hidden py-16 lg:py-20"
      aria-labelledby="reviews-showcase-heading"
    >
      <GoldGlow />

      {/* Hairlines top and bottom tie the band to the sections around it
          without introducing another surface colour. */}
      <div
        className="via-brand-gold/50 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="text-brand-gold-deep font-body text-xs tracking-[0.3em] uppercase">
            Testimonios
          </p>
          <h2
            id="reviews-showcase-heading"
            className="text-brand-text mt-3 font-wordmark text-3xl font-normal sm:text-4xl"
          >
            Lo que dicen nuestras clientas
          </h2>
          <span className="bg-brand-gold mx-auto mt-5 block h-px w-16" aria-hidden="true" />
          <p className="text-brand-text-soft mx-auto mt-5 max-w-md font-body text-sm leading-relaxed">
            Reseñas verificadas de quienes ya llevan Brisal puesto.
          </p>
        </motion.div>

        {/*
          Below md this is a horizontal snap strip. The negative margin +
          matching padding let the cards bleed to the screen edge so the strip
          reads as scrollable, without the page itself ever overflowing —
          overflow-x lives on this element, not on the body.
        */}
        <ul
          className={cn(
            'momentum-scroll-x mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4',
            '-mx-4 px-4 sm:-mx-6 sm:px-6',
            'md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {reviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))}
        </ul>

        {/* Only meaningful while the strip is scrollable. */}
        <p className="text-brand-text-soft/70 mt-2 text-center font-body text-[11px] md:hidden">
          Desliza para ver más
        </p>
      </div>
    </section>
  );
}
