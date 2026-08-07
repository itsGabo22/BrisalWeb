'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ProductGridProps {
  products: Product[];
  className?: string;
  emptyMessage?: string;
  /**
   * Scroll-reveal the cards as they enter the viewport.
   *
   * True for the homepage rails, where the grid sits below the fold and the
   * reveal is the point. FALSE for the catalog, where the product set changes
   * as filters are applied: a reveal there is both a correctness hazard (see
   * the note on the container below) and the wrong feel — filtered results
   * should snap in, not fade.
   */
  revealOnScroll?: boolean;
}

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// Reduced-motion: items appear instantly, no stagger
const itemVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductGrid({
  products,
  className,
  emptyMessage = 'No hay productos disponibles por ahora.',
  revealOnScroll = true,
}: ProductGridProps) {
  const reducedMotion = useReducedMotion();

  if (products.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-24 text-center"
        role="status"
        aria-live="polite"
      >
        {/* Empty state icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-neutral-300"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <p className="font-body text-sm text-brand-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      /**
       * Keyed on the rendered set so the container REMOUNTS whenever the
       * products change.
       *
       * This is what fixed the blank catalog grid. `whileInView` with
       * `viewport={{ once: true }}` fires once and then framer stops
       * observing — and React reuses this exact DOM node across a filter
       * change rather than remounting it (verified: a data-attribute set on
       * the node survived the navigation). Products mounted afterwards
       * therefore inherited the `hidden` variant, opacity 0, with nothing
       * left to move them to `visible`, while the products already on screen
       * kept their finished opacity 1 — blank rows exactly where the newly
       * matched products should have been.
       */
      key={products.map((product) => product.id).join(',')}
      variants={containerVariants}
      /**
       * `initial={false}` on the catalog means the cards mount at their final
       * values: no hidden state to be stranded in, and no dependence on an
       * IntersectionObserver firing after a client-side navigation. The key
       * above already guarantees a correct remount; this removes the failure
       * mode altogether rather than relying on the observer to rescue it.
       */
      initial={revealOnScroll ? 'hidden' : false}
      whileInView={revealOnScroll ? 'visible' : undefined}
      animate={revealOnScroll ? undefined : 'visible'}
      viewport={{ once: true, margin: '-60px' }}
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {products.map((product) => (
        <motion.div
          key={product.id}
          variants={reducedMotion ? itemVariantsReduced : itemVariants}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
}
