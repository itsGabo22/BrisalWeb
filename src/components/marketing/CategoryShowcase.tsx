'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Category } from '@/types';

export interface CategoryShowcaseProps {
  /** Root categories from categoryRepository.getTree(). Order is the DB order. */
  categories: Category[];
}

/** How far one arrow press slides the row, as a fraction of the visible width. */
const SCROLL_STEP_RATIO = 0.8;
/**
 * Arrow enable/disable tolerance. Browsers report fractional scroll offsets at
 * non-integer zoom levels, so an exact `scrollLeft === 0` comparison leaves the
 * left arrow enabled-looking at the true start.
 */
const SCROLL_EPSILON = 8;

function CategoryCard({ category }: { category: Category }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(category.imageUrl) && !imageFailed;

  return (
    <Link
      href={`/catalogo/${category.slug}`}
      className={cn(
        // Basis (not width) + shrink-0 so the cards keep their intended size
        // inside the flex row instead of being squeezed to fit.
        'group relative block shrink-0 snap-start overflow-hidden rounded-2xl',
        'basis-[58%] sm:basis-[38%] lg:basis-[26%] xl:basis-[21%]',
        'focus-visible:ring-brand-gold focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-brand-cream focus-visible:outline-none',
      )}
      style={{ aspectRatio: '3 / 4' }}
    >
      {showImage ? (
        <Image
          src={category.imageUrl as string}
          alt=""
          fill
          sizes="(max-width: 640px) 58vw, (max-width: 1024px) 38vw, 21vw"
          className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
          onError={() => setImageFailed(true)}
        />
      ) : (
        // Placeholder for a category whose image the client hasn't set yet (or
        // whose URL 404s). Deliberately not a broken <img>: a sand panel with
        // the category's initial reads as intentional until an image lands.
        <div
          className="bg-brand-sand absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-brand-gold/45 font-heading text-[clamp(3rem,7vw,5rem)] leading-none font-normal select-none">
            {category.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Cream scrim, per the Phase 1 palette — the label sits on light, not on
          a dark overlay. Anchored to the bottom third so the photograph itself
          stays unveiled. */}
      <div
        className="from-brand-cream via-brand-cream/70 absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t to-transparent"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h3 className="text-brand-text font-heading text-lg font-normal tracking-wide sm:text-xl">
          {category.name}
        </h3>
        <span className="text-brand-gold-deep mt-1 flex items-center gap-1.5 font-body text-[11px] font-normal tracking-[0.16em] uppercase">
          Ver
          <ArrowRight
            className="size-3 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const syncArrows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > SCROLL_EPSILON);
    setCanScrollRight(el.scrollLeft < maxScroll - SCROLL_EPSILON);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    syncArrows();

    // ResizeObserver rather than a window resize listener: the row's overflow
    // also changes when the cards themselves reflow (breakpoint change, font
    // swap settling), not only when the window resizes.
    const observer = new ResizeObserver(syncArrows);
    observer.observe(el);

    el.addEventListener('scroll', syncArrows, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', syncArrows);
    };
  }, [syncArrows]);

  const slide = (direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: el.clientWidth * SCROLL_STEP_RATIO * (direction === 'left' ? -1 : 1),
      behavior: 'smooth',
    });
  };

  if (categories.length === 0) return null;

  return (
    <section
      aria-labelledby="categories-heading"
      className="bg-brand-cream py-16 md:py-24"
    >
      {/* The heading is padded to the content gutter, but the SCROLLER below is
          full-bleed so cards can bleed off the right edge as a "there's more"
          cue. Padding lives on the scroller's inner track instead. */}
      <div className="mx-auto mb-8 flex max-w-7xl items-end justify-between gap-6 px-4 sm:px-6 md:mb-10 lg:px-8">
        <div>
          <h2
            id="categories-heading"
            className="text-brand-text font-heading text-3xl font-normal md:text-4xl"
          >
            Categorías
          </h2>
          <div className="bg-brand-gold mt-3 h-px w-16" aria-hidden="true" />
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/catalogo"
            className="group text-brand-gold-deep hover:text-brand-text focus-visible:ring-brand-gold flex items-center gap-1.5 rounded-sm font-body text-sm font-normal tracking-[0.12em] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Descubrir más
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>

          {/* Desktop-only: touch devices swipe instead. aria-hidden because the
              cards are already reachable by keyboard in DOM order — these are a
              pointer affordance, not a second navigation path. */}
          <div className="hidden items-center gap-1.5 lg:flex" aria-hidden="true">
            <SlideButton
              direction="left"
              disabled={!canScrollLeft}
              onClick={() => slide('left')}
            />
            <SlideButton
              direction="right"
              disabled={!canScrollRight}
              onClick={() => slide('right')}
            />
          </div>
        </div>
      </div>

      {/*
        overflow-x-auto on THIS element (not on any ancestor) is what keeps the
        row from widening the page: the cards overflow their own scroll
        container, so the document itself never gains horizontal scroll.
        scrollbar-width:none hides the bar without disabling the scrolling.
      */}
      <div
        ref={scrollerRef}
        className="momentum-scroll-x flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Categorías — desplázate horizontalmente"
        tabIndex={0}
      >
        {/* Leading/trailing spacers align the first card with the page gutter
            while still letting the row scroll edge to edge. */}
        <div className="w-4 shrink-0 sm:w-6 lg:w-8" aria-hidden="true" />
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
        <div className="w-4 shrink-0 sm:w-6 lg:w-8" aria-hidden="true" />
      </div>
    </section>
  );
}

function SlideButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      tabIndex={-1}
      className={cn(
        'border-brand-line bg-brand-pearl text-brand-text flex size-9 items-center justify-center rounded-full border transition-all',
        disabled
          ? 'cursor-default opacity-35'
          : 'hover:border-brand-gold hover:text-brand-gold-deep active:scale-95',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
