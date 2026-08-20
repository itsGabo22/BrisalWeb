'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { m, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';

const DEFAULT_TITLE = 'Cada pieza, una historia.';
const DEFAULT_BODY =
  'Accesorios en acero y rodio diseñados para acompañar cada momento especial.';

interface BrandStatementProps {
  /** Admin copy. Null/empty falls back to the statement this band shipped with. */
  title?: string | null;
  body?: string | null;
  /**
   * Admin-uploaded loop. Null is a supported, finished state — the band renders
   * the copy centred exactly as it did before rather than an empty player.
   *
   * There is deliberately NO image path here any more. This band was a still
   * with a parallax backdrop once; it is video+text now, and keeping a
   * half-live image fallback would mean two ways to configure one section.
   */
  videoUrl?: string | null;
  /** Focal point (object-position), 0-100. Single point, not a desktop/mobile
   * pair -- the frame is a constant `aspect-square` at every viewport width. */
  posX?: number;
  posY?: number;
  /**
   * Optional internal destination, e.g. "/catalogo/aretes". Null leaves the
   * section exactly as it is today: no link, no pointer cursor, nothing
   * focusable that was not focusable before.
   */
  linkUrl?: string | null;
}

export function BrandStatement({ title, body, videoUrl, posX = 50, posY = 50, linkUrl }: BrandStatementProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const reducedMotion = useReducedMotion();

  /**
   * Gentle scroll-linked drift on the video only.
   *
   * `useScroll` on this section rather than `background-attachment: fixed`,
   * which iOS Safari does not honour and which cannot be disabled per user
   * preference. The frame is `overflow-hidden` and the video is scaled slightly
   * beyond it, so the drift never exposes an edge.
   */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  const heading = title?.trim() || DEFAULT_TITLE;
  const copy = body?.trim() || DEFAULT_BODY;
  const hasVideo = Boolean(videoUrl);
  const href = linkUrl?.trim() || null;

  const videoFrame = hasVideo ? (
    /**
     * FULL-BLEED ON MOBILE. The section carries no horizontal padding below
     * `md` — the text block supplies its own — so this runs edge to edge with
     * no inset and square corners. From `md` the padding returns and the frame
     * takes the small radius the two-up layout wants.
     */
    <div className="relative aspect-square w-full overflow-hidden bg-brand-sand md:rounded-sm">
      <m.video
        src={videoUrl as string}
        // muted + playsInline are both REQUIRED for autoplay on iOS; without
        // playsInline it opens fullscreen. No `controls`, so there is no
        // native click target to compete with the link wrapping this frame.
        autoPlay
        muted
        loop
        playsInline
        style={{ y: reducedMotion ? 0 : videoY, objectPosition: `${posX}% ${posY}%` }}
        className="h-[112%] w-full -translate-y-[6%] object-cover"
        aria-hidden="true"
      />
    </div>
  ) : null;

  return (
    <section
      ref={ref}
      aria-label="Declaración de marca"
      // No horizontal padding until `md`, which is what lets the video reach
      // both edges. Vertical padding is unchanged.
      className="bg-brand-cream py-20 md:px-6 md:py-28"
    >
      <m.div
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: isInView ? 1 : reducedMotion ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 1.1, ease: 'easeOut' }}
        className={cn(
          'relative mx-auto',
          hasVideo
            ? 'grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16'
            : 'max-w-3xl px-6 text-center',
        )}
      >
        {/*
          ORDER MATTERS. On mobile the video comes FIRST (video on top, text
          below); from `md` the text takes column 1 and the video column 2, so
          desktop reads text-left / video-right.

          The link wraps the VIDEO only, not the whole section: a click target
          spanning the body copy makes the text unselectable and hands a screen
          reader one enormous link whose name is the entire section. The
          visible "Ver colección" below gives the same destination a real,
          readable affordance.
        */}
        {href ? (
          <Link
            href={href}
            aria-label={`${heading} — ver colección`}
            className="focus-visible:ring-brand-gold block md:order-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {videoFrame}
          </Link>
        ) : (
          hasVideo && <div className="md:order-2">{videoFrame}</div>
        )}

        <div className={cn(hasVideo && 'px-6 md:order-1 md:px-0')}>
          <p className="font-heading text-[clamp(2rem,5vw,4rem)] leading-tight font-medium text-brand-text">
            {heading}
          </p>
          <p className="text-brand-text-soft mt-6 font-body text-base leading-relaxed md:text-lg">
            {copy}
          </p>

          {href && (
            <Link
              href={href}
              className="group text-brand-gold-deep hover:text-brand-text focus-visible:ring-brand-gold mt-7 inline-flex items-center gap-2 rounded-sm font-body text-sm tracking-[0.08em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Ver colección
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
      </m.div>
    </section>
  );
}
