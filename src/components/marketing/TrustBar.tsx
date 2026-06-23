'use client';

import * as React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const TRUST_ITEMS = [
  { id: 'quality', label: 'Accesorios de calidad premium' },
  { id: 'shipping', label: 'Envío a todo Colombia' },
  { id: 'whatsapp', label: 'Atención personalizada por WhatsApp' },
] as const;

export function TrustBar() {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const reducedMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      aria-label="Beneficios de compra"
      className="w-full bg-brand-gold py-5 text-brand-neutral-900"
    >
      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: isInView ? 1 : reducedMotion ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: 'easeOut' }}
        className="mx-auto flex max-w-6xl gap-8 overflow-x-auto px-6 [scrollbar-width:none] [-ms-overflow-style:none] md:grid md:grid-cols-3 md:overflow-visible md:gap-0 [&::-webkit-scrollbar]:hidden"
      >
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex min-w-[220px] shrink-0 items-center justify-center gap-2.5 md:min-w-0"
          >
            <span className="font-serif text-sm text-brand-neutral-800" aria-hidden="true">
              ✦
            </span>
            <p className="font-sans text-sm font-medium tracking-wide whitespace-nowrap md:whitespace-normal md:text-center">
              {item.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
