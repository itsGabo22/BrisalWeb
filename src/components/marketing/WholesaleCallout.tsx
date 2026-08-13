'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { ParallaxBackdrop } from '@/components/marketing/ParallaxBackdrop';

/**
 * Framing points, not invented metrics.
 *
 * The client has not supplied real wholesale figures — no client count, no
 * margin data — so this adapts the reference's three-up highlight grid while
 * stating only things that are true of the programme as built. Inventing
 * "+1200 clientes" would put a number on the homepage that nobody could stand
 * behind, and it is the kind of claim a customer repeats back. Swap these for
 * real figures the moment there are any.
 */
const HIGHLIGHTS = [
  { value: 'Precios', label: 'exclusivos por volumen' },
  { value: 'Catálogo', label: 'completo en acero y rodio' },
  { value: 'Atención', label: 'directa por WhatsApp' },
] as const;

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
        <p className="font-body text-xs tracking-[0.28em] text-brand-gold-deep uppercase">
          Programa mayorista
        </p>

        <h2 id="wholesale-heading" className="mt-5">
          <span className="block font-heading text-3xl font-medium text-brand-text md:text-4xl">
            ¿Tienes un negocio?
          </span>
          {/*
            The reference's emphasis line: Playfair Display, ITALIC. Addressed
            through `font-wordmark`, which is the role token pinned to Playfair
            — this does NOT touch the BRISAL wordmark itself, which lives in
            HeroSection and is unaffected by anything here.
          */}
          <span className="mt-2 block font-wordmark text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.1] font-normal italic text-brand-gold-deep">
            Aumenta tus ingresos
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-brand-text-soft md:text-lg">
          Accede a precios exclusivos y haz crecer tu negocio con nuestra
          colección completa.
        </p>

        {/* Highlight grid, adapting the reference's stat row. Three columns
            from `sm`, stacked below it — no horizontal overflow at 320px. */}
        <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
          {HIGHLIGHTS.map((item) => (
            <div key={item.value} className="flex flex-col items-center">
              <dt className="font-wordmark text-2xl font-normal italic text-brand-gold-deep md:text-[28px]">
                {item.value}
              </dt>
              <dd className="mt-1 max-w-[16rem] font-body text-sm leading-snug text-brand-text-soft text-balance">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
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
