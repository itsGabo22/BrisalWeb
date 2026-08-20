'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, PackageX, Palette, ShoppingBag } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { getProductReference } from '@/lib/utils/product-reference';
import {
  getEffectivePrice,
  hasWholesalePrice,
  formatCOP,
} from '@/lib/utils/pricing';
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  resolveListingImageUrl,
} from '@/lib/utils/product-images';
import { Badge } from '@/components/ui/badge';
import { Stars } from '@/components/ui/star-rating';
import {
  getPrimaryStock,
  getSelectableColors,
  isProductSoldOut,
} from '@/lib/utils/product-options';
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

  /**
   * Quick add — the product's PRIMARY colour, quantity 1.
   *
   * The card deliberately does not offer a colour picker. Choosing between
   * finishes is what the product page is for, and a second control on a card
   * this size competes with the card's own job. The primary colour is the one
   * whose photo the card is already showing, so the piece that lands in the
   * cart is the piece the shopper clicked.
   */
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = React.useState(false);
  const addedTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) window.clearTimeout(addedTimeoutRef.current);
    };
  }, []);

  /**
   * Two different questions, deliberately not the same one:
   *
   *   • `soldOutEverywhere` — is NO colour of this piece buyable? That is what
   *     the card's "Agotado" badge states, matching the admin product list's
   *     own all-colours rule (`isProductSoldOut`). Judging the badge on the
   *     primary colour alone would stamp Agotado on a piece that is still
   *     purchasable in another finish, talking the shopper out of a sale the
   *     client can fulfil.
   *
   *   • `primaryOut` — can QUICK-ADD do its job? It always adds the primary
   *     colour, so it is the primary colour's stock that gates it, whatever
   *     the rest of the palette holds.
   *
   * When those two disagree — primary empty, another colour in stock — the
   * button stops being an add and becomes a link to the product page, where
   * the shopper can pick a colour that exists. Silently adding a colour with
   * no stock is what this replaces.
   */
  const soldOutEverywhere = React.useMemo(() => isProductSoldOut(product), [product]);
  const primaryOut = getPrimaryStock(product) <= 0;
  const hasOtherColorInStock = primaryOut && !soldOutEverywhere;

  const handleQuickAdd = () => {
    // The button is disabled or swapped for a link in both blocked cases; this
    // is the guard for a card whose stock ran out since the page was rendered.
    if (primaryOut) return;

    addItem({
      productId: product.id,
      name: product.name,
      // The same discounted/wholesale figure the card is displaying, so the
      // cart charges what the grid advertised.
      price: price.final,
      originalPrice: price.original,
      // The card's OWN resolved image, not `imageUrls[0]`: for a product whose
      // photos all live on its colour variants the latter is undefined, and
      // the cart line would show nothing the shopper had just been looking at.
      imageUrl: resolveListingImageUrl(product),
      slug: product.slug,
      // Null colour + null variant is exactly how the cart and the order route
      // already encode "the primary colour", so this needs no special case
      // downstream — `resolveLineVariant` reads that null the same way.
      color: null,
      colorVariantId: null,
      reference: getProductReference(product),
    });

    setAdded(true);
    if (addedTimeoutRef.current) window.clearTimeout(addedTimeoutRef.current);
    addedTimeoutRef.current = window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article
      className={cn('group relative flex flex-col', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image wrapper ─────────────────────────────────
          The quick-add button is a sibling of this Link, not a child of it.
          Nesting a <button> inside an <a> is invalid HTML, and — the reason it
          matters here — the click would bubble to the anchor and navigate to
          the product page, which is exactly what quick-add exists to avoid. */}
      <div className="relative">
        <Link
          href={href}
          aria-label={`Ver producto: ${product.name}`}
          tabIndex={0}
          className="focus-visible:ring-brand-gold relative block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
            <div className="bg-brand-sand absolute inset-0 flex items-center justify-center">
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
            className="bg-brand-cream/25 pointer-events-none absolute inset-0"
            aria-hidden="true"
          />

          {/* Tag badges, with Agotado first when nothing is buyable — it
              outranks "Nuevo" or "En oferta", which are pointless claims about
              a piece the shopper cannot have. */}
          {(soldOutEverywhere || product.tags.length > 0) && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {soldOutEverywhere && <Badge variant="agotado">Agotado</Badge>}
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

        {/*
        Quick add. Replaces the old "Ver producto" chip, which duplicated what
        clicking the card already did — the whole card was a link to the same
        page — and so spent the card's only CTA slot on nothing.

        Always visible on touch, revealed on hover on pointer devices: a hover
        reveal is unreachable on a phone, and this is the primary action.
      */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3',
            'transition-all duration-200 ease-out motion-reduce:transition-none',
            // Plain CSS rather than Framer here: the reveal has to be OFF below
            // `sm` (a hover state is unreachable on a phone, and this is the
            // card's primary action), and a breakpoint is something CSS knows
            // about at paint time while an animated inline style is not.
            'sm:translate-y-2 sm:opacity-0',
            'sm:group-hover:translate-y-0 sm:group-hover:opacity-100',
            // Keyboard users never fire hover, so focus reveals it too —
            // otherwise the button is tabbable while invisible.
            'sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100',
          )}
        >
          {hasOtherColorInStock ? (
            /* Primary colour empty but another finish is in stock. Quick-add
               cannot serve this card — it only ever adds the primary — so it
               hands the shopper to the product page to choose, instead of
               claiming Agotado for a piece that is still for sale. */
            <Link
              href={href}
              aria-label={`Ver colores disponibles de ${product.name}`}
              className={cn(
                'hero-glass-cta font-body pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium tracking-wide text-white',
                'focus-visible:ring-brand-gold transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95',
              )}
            >
              <Palette className="size-3.5" aria-hidden="true" />
              Ver colores
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              /* Disabled when the primary colour has no stock. This button used
                 to be deliberately never disabled — no stock meant "sobre
                 pedido" — and would happily add one unit of nothing. Ordering
                 beyond stock is blocked now, here and in the order route. */
              disabled={primaryOut}
              aria-label={
                primaryOut
                  ? `${product.name} está agotado`
                  : `Agregar ${product.name} al carrito`
              }
              className={cn(
                'hero-glass-cta font-body pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium tracking-wide text-white',
                'focus-visible:ring-brand-gold transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95',
                primaryOut && 'cursor-not-allowed opacity-60 active:scale-100',
              )}
            >
              {primaryOut ? (
                <>
                  <PackageX className="size-3.5" aria-hidden="true" />
                  Agotado
                </>
              ) : added ? (
                <>
                  <Check className="size-3.5" aria-hidden="true" />
                  Agregado
                </>
              ) : (
                <>
                  <ShoppingBag className="size-3.5" aria-hidden="true" />
                  Agregar al carrito
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Announced separately from the button so the confirmation reaches a
          screen reader even though the button's own label never changes. */}
      <span role="status" aria-live="polite" className="sr-only">
        {added ? `${product.name} agregado al carrito` : ''}
      </span>

      {/* ── Info ────────────────────────────────────────── */}
      <div className="mt-3 flex flex-col gap-1 px-1">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="focus-visible:outline-none"
        >
          <h3 className="font-heading text-brand-text line-clamp-2 text-sm leading-snug font-medium">
            {product.name}
          </h3>
        </Link>

        {/* Rating, only once something has actually been approved. A product
            nobody has reviewed shows nothing at all — five empty stars read as
            "rated zero", which is worse than saying nothing. */}
        {product.rating &&
          product.rating.count > 0 &&
          product.rating.average !== null && (
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
              <span className="font-body text-brand-gold-deep text-sm font-medium">
                {formatCOP(product.wholesalePrice as number)}
              </span>
              <span className="font-body text-brand-text-soft/70 text-xs line-through">
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
                price.original !== null
                  ? 'text-brand-gold-deep'
                  : 'text-brand-text',
              )}
            >
              {formatCOP(price.final)}
            </span>

            {price.original !== null && (
              <>
                <span className="font-body text-brand-text-soft/70 text-xs line-through">
                  {formatCOP(price.original)}
                </span>
                {price.percentOff !== null && price.percentOff > 0 && (
                  <span className="border-brand-gold/40 bg-brand-gold/12 text-brand-gold-deep font-body rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
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
