'use client';

import * as React from 'react';
import NextImage from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';

/**
 * Image height as a percentage of the band it fills. The overhang this buys —
 * half above, half below — is what the parallax travel spends.
 */
const OVERSIZE_PERCENT = 130;

/**
 * Travel in each direction, as a percentage of the IMAGE's own height.
 *
 * The ceiling here is arithmetic, not taste: the overhang on each side is
 * (130 - 100) / 2 = 15% of the band, and the travel is TRAVEL × 130% of the
 * band, so anything at or past 11.5% runs the image edge into view at the
 * extremes. 9% spends 11.7% of the band and keeps ~3.3% in reserve.
 *
 * (The brief suggested ±15% at this oversize; that combination is exactly the
 * case that tears, so the travel came down rather than the safety margin.)
 */
const TRAVEL_PERCENT = 9;

interface ParallaxBackdropProps {
  src: string;
  /**
   * Scrim laid over the photo. Required in practice, not decoration: every
   * band using this puts dark copy on top, and the photo is client-uploaded
   * and therefore of unknown brightness.
   */
  overlayClassName?: string;
  /** Set on the first such band above the fold, if there ever is one. */
  priority?: boolean;
}

/**
 * A photo backdrop that scrolls slower than the content in front of it.
 *
 * Deliberately NOT `background-attachment: fixed`. That is the usual one-line
 * way to do this and it is broken on iOS Safari — the background does not
 * actually stay put, which is a long-standing WebKit bug rather than something
 * that can be worked around with prefixes. Nothing here is fixed-positioned
 * either; the whole effect is one `transform: translateY` driven by scroll
 * progress, which composites on the GPU and behaves identically on iOS.
 *
 * The element measures ITSELF rather than taking the section's ref as a prop:
 * it is absolutely inset into the band it decorates, so its own box already is
 * the band, and self-measuring keeps the call site to a single line.
 */
export function ParallaxBackdrop({ src, overlayClassName, priority }: ParallaxBackdropProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // 0 the moment the band's top edge reaches the bottom of the viewport,
    // 1 as its bottom edge leaves the top — so the travel is spread across
    // the entire time the band is on screen rather than bunched at one end.
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [`-${TRAVEL_PERCENT}%`, `${TRAVEL_PERCENT}%`]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-x-0"
        style={{
          height: `${OVERSIZE_PERCENT}%`,
          // Centres the oversized image so the overhang is split evenly.
          top: `${(100 - OVERSIZE_PERCENT) / 2}%`,
          // Reduced motion drops the transform entirely rather than shortening
          // it: the photo stays, only the movement goes.
          ...(reducedMotion ? null : { y }),
        }}
      >
        <NextImage src={src} alt="" fill sizes="100vw" priority={priority} className="object-cover" />
      </motion.div>

      {overlayClassName && <div className={cn('absolute inset-0', overlayClassName)} />}
    </div>
  );
}
