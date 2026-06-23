'use client';

import * as React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export function BrandStatement() {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const reducedMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      aria-label="Declaración de marca"
      className="bg-brand-pearl px-6 py-20 md:py-28"
    >
      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: isInView ? 1 : reducedMotion ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 1.5, ease: 'easeOut' }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="font-serif text-[clamp(2rem,5vw,4rem)] leading-tight font-medium text-brand-neutral-900">
          Cada pieza, una historia.
        </p>
        <p className="mx-auto mt-6 max-w-xl font-sans text-base leading-relaxed text-brand-neutral-600 md:text-lg">
          Accesorios en acero y rodio diseñados para acompañar cada momento
          especial.
        </p>
      </motion.div>
    </section>
  );
}
