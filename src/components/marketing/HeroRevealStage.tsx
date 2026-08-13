'use client';

import * as React from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';

/** How dark the pinned hero gets once fully covered. Deliberately partial. */
const MAX_DARKEN = 0.32;

export interface HeroRevealStageProps {
  /** The hero, which pins. */
  hero: React.ReactNode;
  /** Everything that slides up over it. */
  children: React.ReactNode;
}

/**
 * Pins the hero while the sections below slide up and over it.
 *
 * ── How the pin is bounded ──────────────────────────────────────────────
 * `position: sticky` is clipped by its containing block, and that is the
 * whole unpinning mechanism — no scroll listener decides when to release.
 * The stage wraps the hero AND the overlay content, so the hero stays stuck
 * exactly as long as the stage is on screen; once the overlay has scrolled
 * past, the stage bottom arrives, the hero unsticks and leaves with normal
 * flow. Wrapping the entire rest of the page instead would pin the hero
 * forever (invisibly, behind the overlay) and keep compositing it for the
 * whole scroll.
 *
 * The overlay carries its own opaque background and a `z-index` above the
 * hero, which is what makes it cover rather than blend.
 *
 * ── Reduced motion ──────────────────────────────────────────────────────
 * `position: sticky` is simply not applied, and the darkening layer is not
 * rendered at all. The hero then scrolls away in ordinary document flow and
 * the overlay follows it down the page — no pinning, no parallax-like
 * divergence between two things moving at different speeds, which is the
 * part of this effect that provokes motion sensitivity.
 */
export function HeroRevealStage({ hero, children }: HeroRevealStageProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const overlayRef = React.useRef<HTMLDivElement>(null);

  /**
   * Progress of the overlay across the viewport: 0 when its top edge is at
   * the bottom of the screen (hero fully visible), 1 when it reaches the top
   * (hero fully covered). Tracking the OVERLAY rather than the stage means
   * the value maps directly to "how much of the hero is hidden", whatever
   * the hero's height happens to be.
   */
  const { scrollYProgress } = useScroll({
    target: overlayRef,
    offset: ['start end', 'start start'],
  });

  const darkenOpacity = useTransform(scrollYProgress, [0, 1], [0, MAX_DARKEN]);

  return (
    <div className="hero-reveal-stage">
      <div className={cn('top-0', !reducedMotion && 'sticky')}>
        {hero}

        {/* Depth cue as the overlay takes precedence. Inside the sticky box,
            so it is painted with the hero and stays UNDER the overlay: a
            sticky element establishes a stacking context, so this layer
            cannot escape above the overlay's z-10 sibling. */}
        {!reducedMotion && (
          <m.div
            aria-hidden="true"
            style={{ opacity: darkenOpacity }}
            className="pointer-events-none absolute inset-0 z-30 bg-black"
          />
        )}
      </div>

      {/* The top chrome measures this element to decide when to stop being
          transparent: its top edge reaching the bottom of the chrome is the
          moment cream, not photograph, is behind the nav. The hero itself
          can no longer be measured for that — it is sticky, so its
          bounding rect reports where it is PAINTED, not where it sits in
          flow, and the value would drift as it pins. */}
      <div ref={overlayRef} id="home-reveal-overlay" className="hero-reveal-overlay">
        {children}
      </div>
    </div>
  );
}
