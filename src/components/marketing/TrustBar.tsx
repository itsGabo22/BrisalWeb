'use client';

import * as React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const TRUST_ITEMS = [
  { id: 'quality', label: 'Accesorios de calidad premium' },
  { id: 'shipping', label: 'Env\u00edo a todo Colombia' },
  { id: 'whatsapp', label: 'Atenci\u00f3n personalizada por WhatsApp' },
] as const;

export function TrustBar() {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const reducedMotion = useReducedMotion();
  const marqueeItems = [...TRUST_ITEMS, ...TRUST_ITEMS];

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
        className="overflow-hidden"
      >
        <div className="md:hidden">
          <motion.div
            className="flex w-max gap-8 px-6"
            animate={reducedMotion ? undefined : { x: ['0%', '-50%'] }}
            transition={
              reducedMotion
                ? undefined
                : {
                    duration: 18,
                    ease: 'linear',
                    repeat: Infinity,
                  }
            }
          >
            {marqueeItems.map((item, index) => (
              <TrustItem
                key={`${item.id}-${index}`}
                label={item.label}
                ariaHidden={index >= TRUST_ITEMS.length}
              />
            ))}
          </motion.div>
        </div>

        <div className="mx-auto hidden max-w-6xl grid-cols-3 gap-0 px-6 md:grid">
          {TRUST_ITEMS.map((item) => (
            <TrustItem key={item.id} label={item.label} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function TrustItem({
  label,
  ariaHidden,
}: {
  label: string;
  ariaHidden?: boolean;
}) {
  return (
    <div
      className="flex min-w-[260px] shrink-0 items-center justify-center gap-2.5 md:min-w-0"
      aria-hidden={ariaHidden}
    >
      <span className="font-serif text-sm text-brand-neutral-800" aria-hidden="true">
        {'\u2726'}
      </span>
      <p className="whitespace-nowrap font-sans text-sm font-medium tracking-wide md:whitespace-normal md:text-center">
        {label}
      </p>
    </div>
  );
}
