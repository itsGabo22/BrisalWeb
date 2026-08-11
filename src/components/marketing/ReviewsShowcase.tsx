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
 * Deterministic PRNG (mulberry32).
 *
 * The sparkle field has to look scattered, but `Math.random()` would hand the
 * server one layout and the client another and blow up hydration — this
 * component renders inside a Server Component page. A fixed seed gives the
 * scatter of random numbers with the reproducibility of a constant.
 */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The sparkle field, computed once at module load rather than per render.
 *
 * Not `useMemo`: these values depend on nothing, so there is no reason to
 * recompute them per component instance or to carry them in a hook's
 * dependency graph. Not `useEffect` either — that would leave the field empty
 * through the first paint and pop it in after hydration.
 */
const SPARKLES = (() => {
  const random = createRandom(0x8a6a2f);
  return Array.from({ length: 32 }, (_, id) => ({
    id,
    left: Number((random() * 100).toFixed(2)),
    top: Number((random() * 100).toFixed(2)),
    size: Number((2 + random() * 4).toFixed(2)),
    // 1.4–3.8s, and an independent 0–3s delay: two randomised axes rather
    // than one, so the field never settles into a visible pulse.
    duration: Number((1.4 + random() * 2.4).toFixed(2)),
    delay: Number((random() * 3).toFixed(2)),
  }));
})();

/**
 * The animated backdrop behind the glass, in three layers back-to-front:
 * flowing aurora, static grain + hairline texture, twinkling sparkles.
 *
 * All three exist so the cards' `backdrop-filter` has something real to
 * diffuse. That is not a guess: an earlier pass sat the same cards on a
 * near-flat wash, and toggling `backdrop-filter` off produced a
 * pixel-identical render, because a 14px blur can only soften detail finer
 * than itself. The sparkles are the layer that fixes that — at 2–6px they are
 * exactly the size the card blur destroys.
 *
 * `pointer-events-none` + aria-hidden throughout: this is texture, not
 * content, and none of it should ever be in the tab order or the a11y tree.
 */
function AuroraBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* LAYER 1 — the flowing aurora. Oversized so the animation's excursions
          never bring a container edge into view. */}
      <div
        className={cn(
          'reviews-aurora absolute -inset-[30%]',
          'motion-safe:animate-[brisal-aurora-flow_12s_ease-in-out_infinite]',
        )}
      />

      {/* LAYER 2a — fine-paper grain. The single SVG filter in the section:
          one turbulence raster, applied once, static forever. Per-sparkle SVG
          filters would have been the expensive way to do layer 3. */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.5, mixBlendMode: 'multiply' }}
      >
        <filter id="brisal-reviews-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves={2}
            stitchTiles="stitch"
            result="noise"
          />
          {/* Flat warm-brown RGB with the noise carried entirely in alpha, at
              0.07. That alpha and the 0.5 above are the calibrated restraint
              points — raising either takes this from "fine paper" to "dirty
              glass", which is where an earlier pass landed. */}
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.32  0 0 0 0.07 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#brisal-reviews-grain)" />
      </svg>

      {/* LAYER 2b — one diagonal hairline pass. Deliberately not two: crossed
          passes read as a moiré grid rather than as woven texture. */}
      <div className="reviews-hairline absolute inset-0" />

      {/* LAYER 3 — the sparkle field. Plain absolutely-positioned spans
          animating opacity and transform, both compositor properties, so 32 of
          them cost the main thread nothing. */}
      {SPARKLES.map((sparkle) => (
        <span
          key={sparkle.id}
          className="reviews-sparkle absolute rounded-full"
          style={
            {
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              '--sparkle-duration': `${sparkle.duration}s`,
              '--sparkle-delay': `${sparkle.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
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
        // 76vw, not the 85vw this started at: the leftover 24vw is what makes
        // the next card visibly overhang the right edge. At 85vw the gap ate
        // almost all of it and the strip looked like a single centred card.
        'review-glass flex w-[76vw] shrink-0 snap-center flex-col rounded-2xl p-6 sm:w-[22rem] md:w-auto',
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
  const stripRef = React.useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [hasSwiped, setHasSwiped] = React.useState(false);

  /**
   * Derives the active dot from the strip's scroll offset.
   *
   * "Nearest card centre to the strip's centre" rather than
   * `round(scrollLeft / cardWidth)`: the card width is a vw value, the gap
   * changes at `md`, and the last card can never reach the centre because the
   * strip runs out of scroll — a division would drift out of step at the ends,
   * whereas measuring centres is right at every position by construction.
   *
   * Reads are rAF-coalesced and the listener is passive, so a fast swipe does
   * at most one measurement per frame and never blocks scrolling. Above `md`
   * the strip is a grid with nothing to scroll, and the guard makes this whole
   * effect inert there.
   */
  React.useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      if (strip.scrollWidth <= strip.clientWidth + 1) return;

      if (strip.scrollLeft > 8) setHasSwiped(true);

      const viewportCentre = strip.scrollLeft + strip.clientWidth / 2;
      let nearest = 0;
      let shortest = Number.POSITIVE_INFINITY;

      for (let i = 0; i < strip.children.length; i += 1) {
        const card = strip.children[i] as HTMLElement;
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - viewportCentre);
        if (distance < shortest) {
          shortest = distance;
          nearest = i;
        }
      }

      setActiveIndex(nearest);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    strip.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();

    return () => {
      strip.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /**
   * Scrolls the strip itself rather than calling `scrollIntoView`, which also
   * scrolls the nearest scrollable ANCESTOR — tapping a dot would have jumped
   * the page vertically as well as moving the strip.
   */
  const goToCard = React.useCallback(
    (index: number) => {
      const strip = stripRef.current;
      const card = strip?.children[index] as HTMLElement | undefined;
      if (!strip || !card) return;

      strip.scrollTo({
        left: card.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    },
    [reducedMotion],
  );

  if (reviews.length === 0) return null;

  return (
    <section
      className="reviews-backdrop relative overflow-hidden py-16 lg:py-20"
      aria-labelledby="reviews-showcase-heading"
    >
      <AuroraBackdrop />

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
            Lo que dicen nuestros clientes
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
          ref={stripRef}
          className={cn(
            // `relative` is load-bearing, not cosmetic: it makes this element
            // the offsetParent of the cards, so `card.offsetLeft` and
            // `scrollLeft` above are measured in the same coordinate space.
            'momentum-scroll-x relative mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4',
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

        {/*
          Swipe affordances, mobile only — above `md` every card is already on
          screen in the grid and both of these would be describing a gesture
          that does nothing.
        */}
        {reviews.length > 1 && (
          <div className="mt-4 md:hidden">
            <div className="flex items-center justify-center">
              {reviews.map((review, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => goToCard(index)}
                    // The dot is 6px; the button around it is 20×24 so the tap
                    // target is a real one. Only the dot is painted.
                    className="focus-visible:ring-brand-gold grid h-6 w-5 place-items-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={`Ver reseña ${index + 1} de ${reviews.length}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span
                      className={cn(
                        'block size-1.5 rounded-full motion-safe:transition-[background-color,transform] motion-safe:duration-300',
                        // Scale rather than width: transform composites, width
                        // would relayout the whole row on every swipe.
                        isActive ? 'bg-brand-gold-deep scale-125' : 'bg-brand-line',
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/*
              A static caption, not a nudge animation on the strip. A strip that
              slides by itself on first view is indistinguishable from a
              mis-fired scroll or a layout bug, and it fights scroll-snap on the
              way back; the caption says the same thing unambiguously and costs
              no motion. It is still one-time — it fades out for good the moment
              the strip is actually scrolled — and it fades on OPACITY, so the
              row below it never shifts.
            */}
            <p
              className={cn(
                // The fade is motion-safe too: for a reduced-motion visitor the
                // caption simply stops being there once it has done its job.
                'text-brand-text-soft/70 mt-1 text-center font-body text-[11px]',
                'motion-safe:transition-opacity motion-safe:duration-500',
                hasSwiped ? 'opacity-0' : 'opacity-100',
              )}
              aria-hidden={hasSwiped}
            >
              Desliza para ver más <span aria-hidden="true">→</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
