'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export interface ProductShowcaseSectionProps {
  eyebrow: string;
  title: string;
  products: Product[];
  viewAllHref: string;
  /** Alternates the subtle background tint so sections read as distinct zones. */
  tint?: 'pearl' | 'warm';
}

export function ProductShowcaseSection({
  eyebrow,
  title,
  products,
  viewAllHref,
  tint = 'pearl',
}: ProductShowcaseSectionProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  const reducedMotion = useReducedMotion();

  if (products.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby={`${eyebrow}-heading`}
      className={cn(
        'px-6 py-16 md:py-24',
        tint === 'pearl' ? 'bg-brand-pearl' : 'bg-[#FCF9F4]',
      )}
    >
      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 20 }}
        animate={{
          opacity: isInView ? 1 : reducedMotion ? 1 : 0,
          y: isInView ? 0 : reducedMotion ? 0 : 20,
        }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: 'easeOut' }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-12 text-center">
          <p className="font-sans text-xs font-semibold tracking-[0.3em] text-brand-gold uppercase">
            {eyebrow}
          </p>
          <h2
            id={`${eyebrow}-heading`}
            className="mt-2 font-serif text-3xl font-medium text-brand-neutral-900 md:text-4xl"
          >
            {title}
          </h2>
          <div
            className="mx-auto mt-4 flex items-center justify-center gap-3"
            aria-hidden="true"
          >
            <span className="h-px w-10 bg-brand-gold" />
            <span className="text-[10px] text-brand-gold">◆</span>
            <span className="h-px w-10 bg-brand-gold" />
          </div>
        </div>

        <ProductGrid products={products} />

        <div className="mt-12 flex justify-center">
          <Link
            href={viewAllHref}
            className="group flex items-center gap-1.5 font-sans text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 rounded-sm"
          >
            Ver todos
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
