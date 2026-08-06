'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

// Placeholder washes shown when a category has no uploaded image. Each one is
// a light tint of the palette rather than the near-black gradients these
// replaced, so a category without artwork still reads as a light surface.
const GRADIENT_BY_SLUG: Record<string, string> = {
  aretes: 'bg-gradient-to-br from-brand-cream via-rose-100/70 to-brand-sand',
  collares: 'bg-gradient-to-br from-brand-cream via-brand-gold/25 to-brand-sand',
  brazaletes:
    'bg-gradient-to-br from-brand-cream via-emerald-100/60 to-brand-sand',
  belleza: 'bg-gradient-to-br from-brand-cream via-stone-200/70 to-brand-sand',
};

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-brand-cream to-brand-sand';
const SHOWCASE_SLUGS = ['aretes', 'collares', 'brazaletes', 'belleza'];

export interface CategoryShowcaseProps {
  categories: Category[];
  parentSlug: string;
}

interface CategoryCardProps {
  category: Category;
  index: number;
}

function CategoryCard({ category, index }: CategoryCardProps) {
  const cardRef = React.useRef<HTMLElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-80px' });
  const reducedMotion = useReducedMotion();
  const fromLeft = index % 2 === 0;

  const gradientClass = GRADIENT_BY_SLUG[category.slug] ?? DEFAULT_GRADIENT;

  return (
    <motion.article
      ref={cardRef}
      initial={{
        opacity: reducedMotion ? 1 : 0,
        x: reducedMotion ? 0 : fromLeft ? -48 : 48,
      }}
      animate={{
        opacity: isInView ? 1 : reducedMotion ? 1 : 0,
        x: isInView ? 0 : reducedMotion ? 0 : fromLeft ? -48 : 48,
      }}
      transition={{
        duration: reducedMotion ? 0 : 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative min-h-[320px] w-[82vw] shrink-0 snap-start overflow-hidden rounded-2xl sm:min-h-[380px] sm:w-[420px] md:w-auto"
    >
      <div
        className={cn(
          'absolute inset-0 transition-transform duration-[400ms] ease-out group-hover:scale-105',
          gradientClass,
          category.imageUrl && 'bg-cover bg-center',
        )}
        style={
          category.imageUrl
            ? { backgroundImage: `url(${category.imageUrl})` }
            : undefined
        }
        aria-hidden="true"
      />
      {/* Replaces a flat black/50 wash. The copy sits at the bottom of the
          card (justify-end), so a cream gradient anchored to the bottom edge
          gives the text an opaque light backing while leaving the top ~55% of
          the photograph completely unveiled. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-cream via-brand-cream/80 via-45% to-transparent transition-opacity duration-[400ms] group-hover:opacity-90"
        aria-hidden="true"
      />

      <div className="relative flex h-full min-h-[320px] flex-col justify-end p-8 sm:min-h-[380px] sm:p-10">
        <h3 className="font-heading text-3xl font-normal text-brand-text sm:text-4xl">
          {category.name}
        </h3>
        {category.description ? (
          <p className="text-brand-text-soft mt-2 max-w-sm font-body text-sm leading-relaxed sm:text-base">
            {category.description}
          </p>
        ) : null}
        <div className="mt-6">
          <Button
            variant="ghost"
            size="md"
            asChild
            className="border border-brand-gold/40 bg-brand-pearl/70 text-brand-gold-deep hover:bg-brand-gold/15 hover:text-brand-gold-deep"
          >
            <Link href={`/catalogo/${category.slug}`}>Ver colección</Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  const reducedMotion = useReducedMotion();
  const showcaseCategories = SHOWCASE_SLUGS.map((slug) =>
    categories.find(
      (category) => category.parentId === null && category.slug === slug,
    ),
  ).filter((category): category is Category => Boolean(category));

  return (
    <section
      ref={sectionRef}
      aria-labelledby="collections-heading"
      className="bg-brand-cream px-6 py-16 md:py-24"
    >
      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 16 }}
        animate={{
          opacity: isInView ? 1 : reducedMotion ? 1 : 0,
          y: isInView ? 0 : reducedMotion ? 0 : 16,
        }}
        transition={{ duration: reducedMotion ? 0 : 0.5 }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-12 text-center">
          <h2
            id="collections-heading"
            className="text-brand-text font-heading text-3xl font-normal md:text-4xl"
          >
            Nuestras Colecciones
          </h2>
          <div
            className="bg-brand-gold mx-auto mt-4 h-px w-20"
            aria-hidden="true"
          />
        </div>

        <div className="momentum-scroll-x -mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
          {showcaseCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
