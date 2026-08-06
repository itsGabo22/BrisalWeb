'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function WholesaleCallout() {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const reducedMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      aria-labelledby="wholesale-heading"
      className="relative overflow-hidden bg-brand-sand px-6 py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-cream via-brand-sand to-brand-sand"
        aria-hidden="true"
      />
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
            className="font-heading text-3xl font-normal text-brand-text md:text-4xl"
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
