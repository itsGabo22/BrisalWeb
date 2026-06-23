'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

export interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  const reducedMotion = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      aria-labelledby="featured-heading"
      className="bg-brand-neutral-50 px-6 py-16 md:py-24"
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
          <h2
            id="featured-heading"
            className="font-serif text-3xl font-medium text-brand-neutral-900 md:text-4xl"
          >
            Lo más destacado
          </h2>
          <div
            className="mx-auto mt-4 h-px w-20 bg-brand-gold"
            aria-hidden="true"
          />
        </div>

        <ProductGrid products={products} />

        <div className="mt-12 flex justify-center">
          <Button variant="secondary" size="lg" asChild>
            <Link href="/catalogo">Ver todo el catálogo</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
