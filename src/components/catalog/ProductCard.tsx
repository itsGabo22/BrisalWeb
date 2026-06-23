'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { hasActiveSalePrice, formatCOP } from '@/lib/utils/pricing';
import { Badge } from '@/components/ui/badge';
import type { Product, Tag } from '@/types';

// ─── Badge variant mapping ────────────────────────────────────────────────────
// Maps tag slugs to Badge variant keys defined in the design system.
// Adding a new tag slug here is the only change needed for new badge styles.
type BadgeVariant = 'nuevo' | 'mas-vendido' | 'en-oferta' | 'tendencia';

const TAG_SLUG_TO_VARIANT: Record<string, BadgeVariant> = {
  nuevo: 'nuevo',
  'mas-vendido': 'mas-vendido',
  'en-oferta': 'en-oferta',
  tendencia: 'tendencia',
};

function tagVariant(tag: Tag): BadgeVariant | undefined {
  return TAG_SLUG_TO_VARIANT[tag.slug];
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ProductCardProps {
  product: Product;
  className?: string;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function ProductCard({ product, className }: ProductCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const onSale = hasActiveSalePrice(product);
  const href = `/producto/${product.slug}`;

  return (
    <article
      className={cn('group relative flex flex-col', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image wrapper ───────────────────────────────── */}
      <Link
        href={href}
        aria-label={`Ver producto: ${product.name}`}
        tabIndex={0}
        className="relative block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        style={{ aspectRatio: '3 / 4' }}
      >
        {product.imageUrls[0] ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          // Placeholder when no image is available
          <div className="absolute inset-0 flex items-center justify-center bg-brand-neutral-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-neutral-400"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 bg-brand-neutral-900/20 pointer-events-none"
          aria-hidden="true"
        />

        {/* "Ver producto" CTA */}
        <motion.div
          animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute bottom-0 inset-x-0 flex justify-center pb-4 pointer-events-none"
          aria-hidden="true"
        >
          <span className="pointer-events-none rounded-full bg-brand-pearl/90 backdrop-blur-sm px-5 py-2 font-sans text-xs font-semibold text-brand-neutral-900 shadow-md">
            Ver producto
          </span>
        </motion.div>

        {/* Tag badges */}
        {product.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.tags.map((tag) => {
              const variant = tagVariant(tag);
              if (!variant) return null;
              return (
                <Badge key={tag.id} variant={variant}>
                  {tag.name}
                </Badge>
              );
            })}
          </div>
        )}
      </Link>

      {/* ── Info ────────────────────────────────────────── */}
      <div className="mt-3 flex flex-col gap-1 px-1">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="focus-visible:outline-none"
        >
          <h3 className="font-serif text-sm font-semibold leading-snug text-brand-neutral-900 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-sans text-sm font-bold',
              onSale ? 'text-brand-gold' : 'text-brand-neutral-800',
            )}
          >
            {formatCOP(product.price)}
          </span>

          {onSale && product.comparePrice && (
            <span className="font-sans text-xs text-brand-neutral-400 line-through">
              {formatCOP(product.comparePrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
