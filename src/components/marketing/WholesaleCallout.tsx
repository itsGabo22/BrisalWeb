'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { ParallaxBackdrop } from '@/components/marketing/ParallaxBackdrop';
import { cn } from '@/lib/utils';

interface WholesaleCalloutProps {
  /** Admin parallax backdrop. Null keeps the flat cream→sand gradient. */
  backgroundUrl?: string | null;
  /** Optional background loop. Takes precedence over the image when set. */
  videoUrl?: string | null;
}

export function WholesaleCallout({ backgroundUrl, videoUrl }: WholesaleCalloutProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const reducedMotion = useReducedMotion();

  const hasVideo = Boolean(videoUrl);
  /**
   * Whether real client media is behind the copy, which decides BOTH the scrim
   * and the ink. The two cannot be chosen independently: dark copy needs a
   * light ground, and a light ground over a photograph is exactly the wash
   * that was hiding it.
   */
  const hasMedia = hasVideo || Boolean(backgroundUrl);

  /**
   * Scrim over client media.
   *
   * This band used to lay a flat `bg-brand-cream/78` (video) / `/70` (image)
   * over the whole picture, so only ~22-30% of it ever reached the screen —
   * the "washed out" haze. It existed because the copy was brand-text and the
   * palette rule says nothing dark is a SURFACE.
   *
   * The rule's own stated exceptions are overlays that exist to keep text
   * legible over photography — which is precisely this. So the ground stays
   * the picture and the copy goes light, exactly as the hero and the category
   * band already do, and as the reference banner does.
   *
   * Bottom-weighted rather than uniform: near-clear at the top where nothing
   * is written, deepening through the middle where the lockup sits. At the
   * copy line ~60% of the media still shows through; at the top, ~90%.
   */
  const MEDIA_SCRIM =
    'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.50) 100%)';

  return (
    <section
      ref={ref}
      aria-labelledby="wholesale-heading"
      className="relative overflow-hidden bg-brand-sand px-6 py-24 md:py-32"
    >
      {/* Three grounds, in priority order: video, then photo, then the flat
          gradient this band shipped with. Each is a finished look on its own,
          so an unconfigured section never reads as missing. */}
      {hasVideo ? (
        <video
          src={videoUrl as string}
          // muted + playsInline are both required for iOS to autoplay at all.
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      ) : backgroundUrl ? (
        // No overlay prop: the shared scrim below covers both media paths, so
        // there is one place that decides how much of the picture shows.
        <ParallaxBackdrop src={backgroundUrl} />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-cream via-brand-sand to-brand-sand"
          aria-hidden="true"
        />
      )}

      {hasMedia ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: MEDIA_SCRIM }}
          aria-hidden="true"
        />
      ) : (
        /* The warm gold glow only ever existed to lift the FLAT gradient. Over
           a photograph it is one more veil, so it is not rendered there. */
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(201,169,110,0.18),transparent)]"
          aria-hidden="true"
        />
      )}

      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 24 }}
        animate={{
          opacity: isInView ? 1 : reducedMotion ? 1 : 0,
          y: isInView ? 0 : reducedMotion ? 0 : 24,
        }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: 'easeOut' }}
        className="relative mx-auto max-w-3xl text-center"
      >
        {/*
          Structure taken from the reference banner: script line, then heavy
          caps with ONLY the last word obliqued, then one short subtitle. No
          kicker and no stat row — neither exists in it.

          The reference is a flat JPEG, so none of this could be measured; the
          typefaces are Brisal's own (Jost for the caps, matching the geometric
          sans in the image) plus one script for the accent line.
        */}
        {/* Ink follows the ground. Over media the copy goes light with a
            shadow; on the flat cream it stays exactly the dark palette it has
            always used, so the unconfigured band is unchanged. */}
        <p
          className={cn(
            'font-script text-[clamp(1.75rem,4.5vw,2.5rem)] leading-none font-normal',
            hasMedia ? 'ink-on-media text-brand-gold-light' : 'text-brand-gold-deep',
          )}
        >
          Somos mayoristas
        </p>

        <h2
          id="wholesale-heading"
          // Tight leading and no tracking, as in the reference, where the two
          // lines almost touch. Fluid size so it survives a 320px viewport.
          className={cn(
            'mt-3 font-heading text-[clamp(2.25rem,7vw,4.25rem)] leading-[0.95] font-bold tracking-tight uppercase',
            hasMedia ? 'ink-on-media text-white' : 'text-brand-text',
          )}
        >
          Aumenta tus{' '}
          {/* ONLY the last word is italic — the whole point of the reference's
              treatment. `block` puts it on its own line from `sm`, matching the
              two-line lockup; on the narrowest screens it wraps naturally. */}
          <span className="italic sm:block">Ingresos</span>
        </h2>

        <p
          className={cn(
            'mx-auto mt-5 max-w-lg font-body text-base leading-relaxed md:text-lg',
            hasMedia ? 'ink-on-media text-white/90' : 'text-brand-text-soft',
          )}
        >
          Accede a precios especiales y beneficios exclusivos.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          {/* The SAME glass treatment as the hero CTA — `variant="glass"` maps
              to `.hero-glass-cta`, so there is one definition of that material
              and this cannot drift from it. That class darkens its own backdrop,
              which is what lets white-on-glass stay readable over this light
              band as well as over hero photography. */}
          <Button variant="glass" size="lg" asChild>
            <Link href="/registro-mayorista">Acceder a Mayorista</Link>
          </Button>

          {/* Same variant, size and destination as before — only the ink
              follows the ground, because gold-deep on a dark photograph is an
              unreadable control. The glass CTA beside it needs no such branch:
              it darkens its own backdrop by design. */}
          <Button
            variant="ghost"
            size="lg"
            asChild
            className={cn(
              'border',
              hasMedia
                ? 'ink-on-media border-white/50 text-white hover:border-white/80 hover:bg-white/10 hover:text-white'
                : 'border-brand-gold/40 text-brand-gold-deep hover:bg-brand-gold/10 hover:text-brand-gold-deep',
            )}
          >
            <Link href="/mayoristas">Más información</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
