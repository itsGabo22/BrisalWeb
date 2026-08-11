'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ParallaxBackdrop } from '@/components/marketing/ParallaxBackdrop';

interface WholesaleCalloutProps {
  /**
   * Admin-configured parallax backdrop. Null keeps the flat cream→sand
   * gradient this band shipped with, which is a finished look in its own
   * right — there is no placeholder image to fall back to.
   */
  backgroundUrl?: string | null;
}

export function WholesaleCallout({ backgroundUrl }: WholesaleCalloutProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const reducedMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      aria-labelledby="wholesale-heading"
      className="relative overflow-hidden bg-brand-sand px-6 py-20 md:py-28"
    >
      {backgroundUrl ? (
        // A lighter scrim than BrandStatement gets away with, because the copy
        // here already sits on a bg-brand-pearl/80 glass card rather than
        // directly on the band — worst case that lands the secondary text
        // around 5.2:1 even over a near-black upload.
        <ParallaxBackdrop src={backgroundUrl} overlayClassName="bg-brand-cream/70" />
      ) : (
        // The original ground. Skipped entirely when there is a photo: these
        // are opaque brand colours, so leaving it in would hide the backdrop
        // completely rather than tint it.
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
        className="relative mx-auto max-w-2xl"
      >
        <Card
          glass
          className="border-brand-gold/25 bg-brand-pearl/80 px-8 py-12 text-center md:px-12 md:py-14"
        >
          <h2
            id="wholesale-heading"
            className="font-heading text-3xl font-medium text-brand-text md:text-4xl"
          >
            ¿Tienes un negocio?
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-base leading-relaxed text-brand-text-soft md:text-lg">
            Conoce nuestro programa para mayoristas y accede a precios
            exclusivos.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Button variant="primary" size="lg" asChild>
              <Link href="/registro-mayorista">Registrarme como mayorista</Link>
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
        </Card>
      </motion.div>
    </section>
  );
}
