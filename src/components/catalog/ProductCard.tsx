'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { getEffectivePrice, hasWholesalePrice, formatCOP } from '@/lib/utils/pricing';
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  resolveListingImageUrl,
} from '@/lib/utils/product-images';
import { Badge } from '@/components/ui/badge';
import { Stars } from '@/components/ui/star-rating';
import { getSelectableColors } from '@/lib/utils/product-options';
import { useWholesaleSession } from '@/hooks/useWholesaleSession';
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
  const [imageError, setImageError] = React.useState(false);
  const wholesaleSession = useWholesaleSession();
  const showWholesalePrice =
    wholesaleSession === 'approved' && hasWholesalePrice(product);
  // One call now covers both sale sources — an active Discount row and a
  // hand-set comparePrice — and already accounts for the wholesale view.
  const price = getEffectivePrice(product, showWholesalePrice);
  const colors = React.useMemo(() => getSelectableColors(product), [product]);
  const href = `/producto/${product.slug}`;
  // Resolves through the variants first — see resolveListingImageUrl for the
  // full base-vs-variant rule. A product whose photos all live on its colours
  // used to render an empty card here.
  const imageSrc = imageError
    ? PRODUCT_IMAGE_PLACEHOLDER
    : resolveListingImageUrl(product);
  const hasAnyImage =
    product.imageUrls.length > 0 ||
    product.colorVariants.some((variant) => variant.imageUrls.length > 0);

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
        {hasAnyImage ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          // Placeholder when no image is available
          <div className="absolute inset-0 flex items-center justify-center bg-brand-sand">
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
              className="text-brand-text-soft/60"
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
          className="absolute inset-0 bg-brand-cream/25 pointer-events-none"
          aria-hidden="true"
        />

        {/* "Ver producto" CTA */}
        <motion.div
          animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute bottom-0 inset-x-0 flex justify-center pb-4 pointer-events-none"
          aria-hidden="true"
        >
          <span className="pointer-events-none rounded-full bg-brand-pearl/90 backdrop-blur-sm px-5 py-2 font-body text-xs font-medium tracking-wide text-brand-text shadow-md">
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
          <h3 className="font-heading text-sm font-medium leading-snug text-brand-text line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating, only once something has actually been approved. A product
            nobody has reviewed shows nothing at all — five empty stars read as
            "rated zero", which is worse than saying nothing. */}
        {product.rating && product.rating.count > 0 && product.rating.average !== null && (
          <div className="flex items-center gap-1.5">
            <Stars value={product.rating.average} size="sm" />
            <span className="text-brand-text-soft/80 font-body text-[11px] tabular-nums">
              {product.rating.average.toFixed(1)} ({product.rating.count})
            </span>
          </div>
        )}

        {/* Colour dots, so a shopper scanning the grid can see a piece comes
            in several finishes. Capped at four with a "+N" so a product with
            many colours can't push the price out of the card. */}
        {/* Shown from two colours up: a single dot beside a product that only
            comes one way says nothing worth the visual noise. */}
        {colors.length > 1 && (
          <div
            className="flex items-center gap-1"
            aria-label={`Colores disponibles: ${colors
              .map((color) => color.colorName)
              .join(', ')}`}
          >
            {colors.slice(0, 4).map((color) => (
              <span
                key={color.id}
                title={color.colorName}
                className="border-brand-line size-3 rounded-full border"
                style={{ backgroundColor: color.colorHex }}
              />
            ))}
            {colors.length > 4 && (
              <span className="text-brand-text-soft/70 font-body text-[10px] tabular-nums">
                +{colors.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Pricing */}
        {showWholesalePrice ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="font-body text-sm font-medium text-brand-gold-deep">
                {formatCOP(product.wholesalePrice as number)}
              </span>
              <span className="font-body text-xs text-brand-text-soft/70 line-through">
                {formatCOP(product.price)}
              </span>
            </div>
            <Badge variant="mayorista" className="w-fit">
              Precio mayorista
            </Badge>
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span
              className={cn(
                'font-body text-sm font-medium',
                price.original !== null ? 'text-brand-gold-deep' : 'text-brand-text',
              )}
            >
              {formatCOP(price.final)}
            </span>

            {price.original !== null && (
              <>
                <span className="font-body text-xs text-brand-text-soft/70 line-through">
                  {formatCOP(price.original)}
                </span>
                {price.percentOff !== null && price.percentOff > 0 && (
                  <span className="border-brand-gold/40 bg-brand-gold/12 text-brand-gold-deep rounded-full border px-1.5 py-0.5 font-body text-[10px] font-medium tabular-nums">
                    -{price.percentOff}%
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
