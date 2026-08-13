'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';
import type { Category } from '@/types';

export interface CategoryShowcaseProps {
  /** Root categories from categoryRepository.getTree(). Order is the DB order. */
  categories: Category[];
}

/**
 * Panel aspect ratio, measured off cornalinaaccesorios.com's category band:
 * their panels render 348x435, i.e. 0.8 — a 4:5 portrait.
 */
const PANEL_ASPECT = '4 / 5';

/**
 * Tolerance for "are we at the end". Fractional scroll offsets at non-integer
 * zoom levels mean an exact comparison never quite reaches the boundary.
 */
const SCROLL_EPSILON = 8;


function CategoryPanel({ category }: { category: Category }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(category.imageUrl) && !imageFailed;

  return (
    <Link
      href={`/catalogo/${category.slug}`}
      className={cn(
        'group relative block shrink-0 snap-start overflow-hidden',
        // No rounding and no margin — panels butt directly against their
        // neighbours to read as one continuous filmstrip.
        'basis-[62%] sm:basis-[42%] lg:basis-[28%] xl:basis-[23%]',
        'focus-visible:ring-brand-gold focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none',
      )}
      style={{ aspectRatio: PANEL_ASPECT }}
    >
      {showImage ? (
        <Image
          src={category.imageUrl as string}
          alt=""
          fill
          sizes="(max-width: 640px) 62vw, (max-width: 1024px) 42vw, 23vw"
          className="object-cover transition-transform duration-[600ms] ease-out motion-safe:group-hover:scale-105"
          onError={() => setImageFailed(true)}
        />
      ) : (
        // Placeholder for a category whose image the client hasn't uploaded yet
        // (or whose URL 404s). A sand panel with the category's initial reads as
        // intentional; a broken <img> would not.
        <div
          className="bg-brand-sand absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-brand-gold/40 font-wordmark text-[clamp(3rem,8vw,5.5rem)] leading-none select-none">
            {category.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Legibility scrim, matching Cornalina's measured
          `linear-gradient(to top, rgba(0,0,0,0.43), rgba(0,0,0,0))`.
          This is an overlay ON PHOTOGRAPHY for text contrast — the same
          exemption the hero has — not a dark surface in the palette sense.
          Which is exactly why it is skipped for the placeholder: over a flat
          sand panel it buys no contrast and just muddies the cream. */}
      {showImage && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Bottom-centred, exactly like the reference: a small "Categoría"
          kicker above the uppercase category name. White over photography,
          brand-text over the light placeholder. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-4 text-center">
        <span
          className={cn(
            'font-body text-[11px] font-light tracking-[0.08em]',
            showImage ? 'text-white/85' : 'text-brand-text-soft',
          )}
        >
          Categoría
        </span>
        <h3
          className={cn(
            'font-body text-base font-normal tracking-[0.06em] uppercase sm:text-lg',
            showImage ? 'text-white' : 'text-brand-text',
          )}
        >
          {category.name}
        </h3>
      </div>
    </Link>
  );
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const reducedMotion = useReducedMotion();

  const syncArrow = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollRight(el.scrollLeft < maxScroll - SCROLL_EPSILON);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    syncArrow();

    // ResizeObserver rather than a window resize listener: the row's overflow
    // also changes when the panels reflow (breakpoint change, font swap
    // settling), not only when the window resizes.
    const observer = new ResizeObserver(syncArrow);
    observer.observe(el);
    el.addEventListener('scroll', syncArrow, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', syncArrow);
    };
  }, [syncArrow]);

  const slideRight = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const panel = el.firstElementChild as HTMLElement | null;
    const panelWidth = panel?.getBoundingClientRect().width ?? 0;
    if (panelWidth <= 0) return;

    // Advance by whole panels — as many as currently fit, minus one so the
    // panel that was peeking at the edge leads the next view. Targeting an
    // exact multiple of the panel width means we always land ON a snap point,
    // so `scroll-snap-type: x mandatory` has nothing to correct afterwards.
    const perView = Math.max(1, Math.floor(el.clientWidth / panelWidth) - 1);
    const currentIndex = Math.round(el.scrollLeft / panelWidth);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = Math.min((currentIndex + perView) * panelWidth, maxScroll);

    el.scrollTo({
      left: target,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  if (categories.length === 0) return null;

  return (
    /*
      Section-level entrance. Opacity ONLY — no y-translation.

      The band now arrives by sliding up over the pinned hero (see
      HeroRevealStage), and that IS its entrance. Adding a rise on top pulled
      the section away from the trust bar above it mid-animation, and because
      the thing behind the overlay is a live photograph rather than the page
      background, the gap showed the hero straight through the middle of the
      overlay. The fade survives because it costs nothing and softens the
      first paint of the images.

      Deliberately on the SECTION and not on the panels: the filmstrip has its
      own hover/scroll/arrow choreography, and animating each panel in would
      both compete with that and fight the horizontal scroller, whose
      ResizeObserver would be measuring mid-transform.
    */
    <m.section
      aria-labelledby="categories-heading"
      className="bg-brand-cream py-14 md:py-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reducedMotion ? 0.01 : 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 md:mb-8 lg:px-8">
        <h2
          id="categories-heading"
          className="text-brand-text font-heading text-2xl font-medium tracking-wide uppercase md:text-[28px]"
        >
          Categorías
        </h2>

        <Link
          href="/catalogo"
          className="group text-brand-text hover:text-brand-gold-deep focus-visible:ring-brand-gold flex items-center gap-1.5 rounded-sm font-body text-sm font-normal whitespace-nowrap underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Descubrir más
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* `relative` anchors the advance arrow over the band's right edge. */}
      <div className="relative">
        {/*
          gap-0: the panels touch, forming one continuous band. Full-bleed —
          no horizontal padding and no gutter spacers — so the strip runs edge
          to edge and the next panel is cut off by the viewport, which is the
          "there's more" cue.

          overflow-x-auto lives on THIS element, so the panels overflow their
          own scroll container and the document never gains horizontal scroll.
        */}
        <div
          ref={scrollerRef}
          className="momentum-scroll-x flex snap-x snap-mandatory gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-label="Categorías — desplázate horizontalmente"
          tabIndex={0}
        >
          {categories.map((category) => (
            <CategoryPanel key={category.id} category={category} />
          ))}
        </div>

        {/* Circular advance control overlapping the right edge, as on the
            reference. Hidden once the row is fully scrolled, and pointer-only:
            the panels are already reachable by keyboard in DOM order, so this
            is an affordance rather than a second navigation path. */}
        {canScrollRight && (
          <button
            type="button"
            onClick={slideRight}
            tabIndex={-1}
            aria-hidden="true"
            className="bg-brand-pearl text-brand-text hover:bg-brand-gold/15 hover:text-brand-gold-deep absolute top-1/2 right-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-colors active:scale-95 sm:right-6 md:flex"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </m.section>
  );
}
