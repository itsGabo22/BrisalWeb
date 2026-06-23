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
      className="relative overflow-hidden bg-brand-neutral-900 px-6 py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-neutral-900 via-[#0F0E0C] to-brand-neutral-800"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(204,164,45,0.1),transparent)]"
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
          className="border-white/10 bg-white/5 px-8 py-12 text-center md:px-12 md:py-14"
        >
          <h2
            id="wholesale-heading"
            className="font-serif text-3xl font-medium text-brand-neutral-50 md:text-4xl"
          >
            ¿Tienes un negocio?
          </h2>
          <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-brand-neutral-300 md:text-lg">
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
              className="border border-white/20 text-brand-neutral-100 hover:bg-white/10 hover:text-brand-gold-light"
            >
              <Link href="/mayoristas">Más información</Link>
            </Button>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
