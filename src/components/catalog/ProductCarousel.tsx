'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

/**
 * Time a slide rests before the rail advances.
 *
 * The brief allows 4-6s; 5s is the middle. Below ~4s a shopper cannot finish
 * reading a name and price before the row moves, and above ~6s the motion stops
 * reading as a rail and starts reading as a glitch.
 */
const AUTO_ADVANCE_MS = 5000;

/**
 * How long after the last scroll event the rail is considered idle.
 *
 * There is no cross-browser `scrollend` yet (Safari shipped it late), so the
 * seamless wrap is done on a short debounce instead. It must comfortably
 * outlast a smooth `scrollTo`, or the wrap would fire mid-animation and the
 * browser would cancel the scroll.
 */
const SCROLL_IDLE_MS = 160;

/** Grace period after a manual interaction before auto-advance resumes. */
const RESUME_AFTER_MS = 8000;

export interface ProductCarouselProps {
  products: Product[];
  className?: string;
}

/**
 * A horizontally-sliding rail of product cards that advances on its own.
 *
 * Built on the SAME primitive as `CategoryShowcase`: a native `overflow-x-auto`
 * scroller with CSS scroll-snap, rather than a transform-driven track. Native
 * scrolling is what gives swipe, trackpad, momentum and keyboard for free and,
 * more importantly, it is why this cannot introduce horizontal overflow at the
 * page level — the cards overflow their own scroll container, and the document
 * never learns they are wider than the viewport.
 *
 * The infinite loop is the one thing that primitive does not provide, so the
 * list is rendered twice and the scroll position is silently rewound by exactly
 * one copy's width whenever it crosses into the second. Because the two halves
 * are identical, the rewind is invisible — there is no "rewind to the start"
 * jump that a single-copy rail would need.
 */
export function ProductCarousel({ products, className }: ProductCarouselProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [isPaused, setIsPaused] = React.useState(false);
  const [canLoop, setCanLoop] = React.useState(false);

  /**
   * Doubling only pays for itself once the rail actually overflows. With three
   * cards on a desktop row there is nothing to scroll, and a second copy would
   * just render six cards where the client put three.
   */
  const shouldLoop = canLoop && products.length > 1;
  const rendered = shouldLoop ? [...products, ...products] : products;

  /** Distance of one full copy of the list, i.e. the wrap period. */
  const copyWidth = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !shouldLoop) return 0;
    return el.scrollWidth / 2;
  }, [shouldLoop]);

  /**
   * Card stride — one card plus the gap after it — measured rather than
   * hard-coded, so it stays correct across breakpoints and after a font swap
   * reflows the row.
   */
  const cardStride = React.useCallback(() => {
    const el = scrollerRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    const second = el?.children[1] as HTMLElement | undefined;
    if (!el || !first) return 0;
    if (second) return second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    return first.getBoundingClientRect().width;
  }, []);

  /**
   * Cards to move per step: however many currently fit, so the rail always
   * turns over a full page of product. At the card widths below this works out
   * to 2 on a phone and 4 on a desktop — matching the grid the other showcase
   * renders, so the two sections stay visually consistent.
   */
  const perStep = React.useCallback(() => {
    const el = scrollerRef.current;
    const stride = cardStride();
    if (!el || stride <= 0) return 1;
    return Math.max(1, Math.floor(el.clientWidth / stride));
  }, [cardStride]);

  /**
   * Rewind by one copy once the rail has scrolled into the duplicate half.
   * Instant and unanimated on purpose: the pixels either side of the boundary
   * are identical, so there is nothing to see.
   */
  const normalize = React.useCallback(() => {
    const el = scrollerRef.current;
    const period = copyWidth();
    if (!el || period <= 0) return;
    if (el.scrollLeft >= period) el.scrollLeft -= period;
  }, [copyWidth]);

  const advance = React.useCallback(
    (direction: 1 | -1) => {
      const el = scrollerRef.current;
      const stride = cardStride();
      if (!el || stride <= 0) return;

      const period = copyWidth();
      // Going back from the very start would hit the left wall, so hop forward
      // one copy first. Same trick as `normalize`, mirrored.
      if (direction === -1 && period > 0 && el.scrollLeft < stride) {
        el.scrollLeft += period;
      }

      el.scrollBy({
        left: direction * perStep() * stride,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    },
    [cardStride, copyWidth, perStep, reducedMotion],
  );

  /**
   * Whether the rail overflows at all. Measured after mount because it depends
   * on the rendered card widths, and re-measured on resize because a phone
   * rotating landscape can change the answer.
   */
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const measure = () => {
      // Compare against the UNDOUBLED width so the answer doesn't flip-flop:
      // once doubled the rail always overflows, which would keep it latched on.
      const single = shouldLoop ? el.scrollWidth / 2 : el.scrollWidth;
      setCanLoop(single > el.clientWidth + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoop, products.length]);

  /**
   * Seamless wrap, on scroll idle. Covers every way the position can move —
   * auto-advance, arrow, swipe, trackpad — with one rule, instead of trying to
   * intercept each of them.
   */
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !shouldLoop) return;

    let idleTimer: number | undefined;
    const onScroll = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(normalize, SCROLL_IDLE_MS);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(idleTimer);
      el.removeEventListener('scroll', onScroll);
    };
  }, [shouldLoop, normalize]);

  /**
   * Auto-advance.
   *
   * Skipped entirely under `prefers-reduced-motion` — content that moves on its
   * own is precisely what that setting is about — while the arrows below stay
   * available, so the rail is still fully navigable, just never unprompted.
   */
  React.useEffect(() => {
    if (reducedMotion || isPaused || !shouldLoop) return;
    const timer = window.setInterval(() => advance(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, isPaused, shouldLoop, advance]);

  /**
   * Manual interaction resets the clock: pausing and immediately unpausing
   * restarts the interval (the effect above re-runs), so a shopper who just
   * swiped gets the full dwell time rather than the remainder of a tick that
   * was already half spent.
   */
  const resumeTimerRef = React.useRef<number | null>(null);
  const deferResume = React.useCallback(() => {
    setIsPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => setIsPaused(false), RESUME_AFTER_MS);
  }, []);

  React.useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleArrow = (direction: 1 | -1) => {
    deferResume();
    advance(direction);
  };

  if (products.length === 0) return null;

  return (
    // `relative` anchors the arrows; `group` lets them fade in with hover.
    <div
      className={cn('group/rail relative', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      // Touch pauses on contact and hands over to the resume timer on release,
      // so the rail doesn't slide out from under a thumb mid-swipe.
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={deferResume}
    >
      <div
        ref={scrollerRef}
        // A live region would announce every auto-advance, so this is a plain
        // labelled scroll region: the cards are in DOM order and reachable by
        // keyboard whether or not the rail ever moves.
        role="region"
        aria-label="Más vendidos — desplázate horizontalmente"
        aria-roledescription="carrusel"
        tabIndex={0}
        className={cn(
          'momentum-scroll-x flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2',
          // Scrollbar hidden because the rail advertises itself by moving and
          // by the peeking next card; a scrollbar under the cards would read
          // as chrome bolted onto the design.
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-4 rounded-sm',
        )}
      >
        {rendered.map((product, index) => {
          // Everything past the original list is the duplicate half: it exists
          // only to make the wrap seamless, so it is hidden from assistive tech
          // and taken out of the tab order rather than announced twice.
          const isDuplicate = index >= products.length;
          return (
            <div
              key={`${product.id}-${index < products.length ? 'a' : 'b'}`}
              // 45% on a phone shows two cards with the third peeking — the
              // peek is the affordance that says the row scrolls. The widths
              // step down to a quarter on desktop, matching ProductGrid's
              // 2/3/4 columns so the two homepage showcases line up.
              className="w-[45%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]"
              aria-hidden={isDuplicate || undefined}
              inert={isDuplicate || undefined}
            >
              <ProductCard product={product} />
            </div>
          );
        })}
      </div>

      {/* Arrows. Pointer-only and `aria-hidden`: the scroller itself is
          focusable and arrow-key scrollable, so these are an affordance rather
          than a second navigation path that a screen reader would have to
          describe. Hidden on touch, where the swipe is the control. */}
      {shouldLoop && (
        <>
          <button
            type="button"
            onClick={() => handleArrow(-1)}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute top-1/3 -left-2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-pearl text-brand-text shadow-lg transition-all hover:bg-brand-gold/15 hover:text-brand-gold-deep active:scale-95 md:flex lg:-left-5"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleArrow(1)}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute top-1/3 -right-2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-pearl text-brand-text shadow-lg transition-all hover:bg-brand-gold/15 hover:text-brand-gold-deep active:scale-95 md:flex lg:-right-5"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
