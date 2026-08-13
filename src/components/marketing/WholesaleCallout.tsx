'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { ParallaxBackdrop } from '@/components/marketing/ParallaxBackdrop';

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
        <>
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
          {/* Same light-scrim rule as the photo path: the copy here is
              brand-text, and nothing dark is a surface in this palette. */}
          <div
            className="pointer-events-none absolute inset-0 bg-brand-cream/78"
            aria-hidden="true"
          />
        </>
      ) : backgroundUrl ? (
        <ParallaxBackdrop src={backgroundUrl} overlayClassName="bg-brand-cream/70" />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-cream via-brand-sand to-brand-sand"
          aria-hidden="true"
        />
      )}

      {/* Translucent, so it keeps warming whichever ground is underneath. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(201,169,110,0.18),transparent)]"
        aria-hidden="true"
      />

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
        <p className="font-script text-[clamp(1.75rem,4.5vw,2.5rem)] leading-none font-normal text-brand-gold-deep">
          Somos mayoristas
        </p>

        <h2
          id="wholesale-heading"
          // Tight leading and no tracking, as in the reference, where the two
          // lines almost touch. Fluid size so it survives a 320px viewport.
          className="mt-3 font-heading text-[clamp(2.25rem,7vw,4.25rem)] leading-[0.95] font-bold tracking-tight text-brand-text uppercase"
        >
          Aumenta tus{' '}
          {/* ONLY the last word is italic — the whole point of the reference's
              treatment. `block` puts it on its own line from `sm`, matching the
              two-line lockup; on the narrowest screens it wraps naturally. */}
          <span className="italic sm:block">Ingresos</span>
        </h2>

        <p className="mx-auto mt-5 max-w-lg font-body text-base leading-relaxed text-brand-text-soft md:text-lg">
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

          <Button
            variant="ghost"
            size="lg"
            asChild
            className="border border-brand-gold/40 text-brand-gold-deep hover:bg-brand-gold/10 hover:text-brand-gold-deep"
          >
            <Link href="/mayoristas">Más información</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
