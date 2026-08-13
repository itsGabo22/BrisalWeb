'use client';

import * as React from 'react';
import { m, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import { ParallaxBackdrop } from '@/components/marketing/ParallaxBackdrop';
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
   */
  videoUrl?: string | null;
  /**
   * The parallax backdrop the client may already have configured. Kept
   * independent of the video: it is a different admin control, and dropping it
   * when the video landed would silently discard an uploaded image.
   */
  backgroundUrl?: string | null;
}

export function BrandStatement({
  title,
  body,
  videoUrl,
  backgroundUrl,
}: BrandStatementProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const reducedMotion = useReducedMotion();

  /**
   * Gentle scroll-linked drift on the video only.
   *
   * `useScroll` on this section rather than `background-attachment: fixed`,
   * which iOS Safari does not honour and which cannot be disabled per user
   * preference. The range is deliberately small — the frame is `overflow-hidden`
   * and the video is scaled slightly beyond it, so the drift never exposes an
   * edge.
   */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  const heading = title?.trim() || DEFAULT_TITLE;
  const copy = body?.trim() || DEFAULT_BODY;
  const hasVideo = Boolean(videoUrl);

  /**
   * The video wins over the parallax photo — the same priority the wholesale
   * band uses, and the same wording the admin panel promises.
   *
   * Both are imagery for one section, and running them together puts a
   * photograph behind the copy AND a moving frame beside it: the text loses
   * contrast and neither image is the subject. The backdrop is not discarded,
   * only stood down while a video is set, so removing the video brings it
   * straight back.
   */
  const showBackdrop = Boolean(backgroundUrl) && !hasVideo;

  return (
    <section
      ref={ref}
      aria-label="Declaración de marca"
      className={cn(
        'bg-brand-cream px-6 py-20 md:py-28',
        showBackdrop && 'relative overflow-hidden',
      )}
    >
      {showBackdrop && backgroundUrl && (
        // A LIGHT scrim, not a dark one: this band's copy is brand-text, and
        // the palette rule is that nothing dark is used as a surface. 80%
        // cream keeps the section reading as a light surface while still
        // letting the photo through as depth.
        <ParallaxBackdrop src={backgroundUrl} overlayClassName="bg-brand-cream/80" />
      )}

      <m.div
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: isInView ? 1 : reducedMotion ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 1.1, ease: 'easeOut' }}
        className={cn(
          // `relative` so it stacks above the parallax backdrop when one is set.
          'relative mx-auto',
          // With a video this is a two-up band; without one it stays the
          // centred statement it has always been, at its original measure.
          hasVideo
            ? 'grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16'
            : 'max-w-3xl text-center',
        )}
      >
        {/*
          ORDER MATTERS. On mobile the video comes FIRST (video on top, text
          below); from `md` the text takes column 1 and the video column 2, so
          desktop reads text-left / video-right. `md:order-*` is what swaps
          them without duplicating either block.
        */}
        {hasVideo && (
          <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-brand-sand md:order-2">
            <m.video
              src={videoUrl as string}
              // muted + playsInline are both REQUIRED for autoplay to be
              // allowed on iOS; without playsInline it opens fullscreen.
              autoPlay
              muted
              loop
              playsInline
              // Scaled past the frame so the parallax drift always has cover
              // to move into rather than revealing a gap at the edges.
              style={{ y: reducedMotion ? 0 : videoY }}
              className="h-[112%] w-full -translate-y-[6%] object-cover"
              aria-hidden="true"
            />
          </div>
        )}

        <div className={cn(hasVideo && 'md:order-1')}>
          <p className="font-heading text-[clamp(2rem,5vw,4rem)] leading-tight font-medium text-brand-text">
            {heading}
          </p>
          <p
            className={cn(
              'mt-6 font-body text-base leading-relaxed md:text-lg',
              // brand-text-soft only clears AA on the flat cream. Over a photo
              // — even behind the scrim — it drops to ~3.7:1 on a dark upload,
              // so the band steps up to the primary token instead.
              showBackdrop ? 'text-brand-text' : 'text-brand-text-soft',
              // The centred fallback keeps its original narrow measure; the
              // two-up layout is already column-constrained.
              !hasVideo && 'mx-auto max-w-xl',
            )}
          >
            {copy}
          </p>
        </div>
      </m.div>
    </section>
  );
}
