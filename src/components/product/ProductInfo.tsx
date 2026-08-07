'use client';

import * as React from 'react';
import { Check, Minus, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';
import {
  formatCOP,
  getEffectivePrice,
  getVariantStock,
  hasWholesalePrice,
  productForVariant,
} from '@/lib/utils/pricing';
import { getVariantReference } from '@/lib/utils/product-reference';
import { useWholesaleSession } from '@/hooks/useWholesaleSession';
import type { ColorVariant, Product, Tag } from '@/types';

interface ProductInfoProps {
  product: Product;
  /** Null when the product has no colour variants. */
  selectedVariant?: ColorVariant | null;
  onSelectVariant?: (variant: ColorVariant) => void;
}

type BadgeVariant = 'nuevo' | 'mas-vendido' | 'en-oferta' | 'tendencia';

const TAG_SLUG_TO_VARIANT: Record<string, BadgeVariant> = {
  nuevo: 'nuevo',
  'mas-vendido': 'mas-vendido',
  'en-oferta': 'en-oferta',
  tendencia: 'tendencia',
};

function getTagVariant(tag: Tag): BadgeVariant | undefined {
  return TAG_SLUG_TO_VARIANT[tag.slug];
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

export function ProductInfo({
  product,
  selectedVariant = null,
  onSelectVariant,
}: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const wholesaleSession = useWholesaleSession();

  /**
   * The product re-priced for the chosen colour. Everything below then works
   * on a normal Product, so discounts and wholesale gating need no knowledge
   * of variants at all.
   */
  const priced = productForVariant(product, selectedVariant);
  const showWholesalePrice =
    wholesaleSession === 'approved' && hasWholesalePrice(priced);
  const price = getEffectivePrice(priced, showWholesalePrice);
  const stock = getVariantStock(product, selectedVariant);
  const variants = product.colorVariants;
  // Changes with the selected colour, so the shopper and the client are
  // always looking at the same reference for the same thing.
  const reference = getVariantReference(product, selectedVariant);
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const addedTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) {
        window.clearTimeout(addedTimeoutRef.current);
      }
    };
  }, []);

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(clampQuantity(event.target.valueAsNumber));
  };

  const handleAddToCart = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        // The DISCOUNTED price, so the cart charges what the page advertises.
        // This previously used the pre-discount base, which is now a real
        // difference rather than a no-op.
        price: price.final,
        // The chosen colour's own first image, so the cart line shows what
        // the shopper actually picked.
        imageUrl:
          selectedVariant?.imageUrls[0] ?? product.imageUrls[0] ?? '',
        slug: product.slug,
        color: selectedVariant?.colorName ?? null,
        reference,
      },
      quantity,
    );
    setAdded(true);

    if (addedTimeoutRef.current) {
      window.clearTimeout(addedTimeoutRef.current);
    }
    addedTimeoutRef.current = window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  const productUrl =
    typeof window === 'undefined'
      ? `/producto/${product.slug}`
      : `${window.location.origin}/producto/${product.slug}`;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hola, me interesa el producto: ${product.name} — ${productUrl}`,
      )}`
    : null;

  return (
    <article className="flex flex-col gap-6 lg:pt-4">
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Etiquetas del producto">
          {product.tags.map((tag) => {
            const variant = getTagVariant(tag);

            if (!variant) {
              return null;
            }

            return (
              <Badge key={tag.id} variant={variant}>
                {tag.name}
              </Badge>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <h1 className="font-heading text-3xl font-medium leading-tight text-brand-text sm:text-4xl">
          {product.name}
        </h1>

        {product.material && (
          <p className="font-body text-sm text-brand-neutral-500">
            Material: {product.material}
          </p>
        )}

        <p className="text-brand-text-soft/80 font-body text-xs tracking-wide">
          Ref: {reference}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3" aria-label="Precio">
        {showWholesalePrice ? (
          <>
            <span className="font-body text-sm text-brand-neutral-400 line-through">
              {formatCOP(product.price)}
            </span>
            <span className="font-body text-2xl font-medium text-brand-gold">
              {formatCOP(product.wholesalePrice as number)}
            </span>
            <Badge variant="mayorista">Precio mayorista</Badge>
          </>
        ) : price.original !== null ? (
          <>
            <span className="font-body text-sm text-brand-neutral-400 line-through">
              {formatCOP(price.original)}
            </span>
            <span className="font-body text-2xl font-medium text-brand-gold-deep">
              {formatCOP(price.final)}
            </span>
            {/* The discount's own label ("Black friday") when the reduction
                came from a Discount row; the generic badge when it came from a
                hand-set comparePrice. */}
            <Badge variant="en-oferta">
              {price.percentOff !== null && price.percentOff > 0
                ? `-${price.percentOff}%`
                : 'En oferta'}
            </Badge>
            {price.discount?.label && (
              <span className="text-brand-text-soft font-body text-xs">
                {price.discount.label}
              </span>
            )}
          </>
        ) : (
          <span className="font-body text-2xl font-medium text-brand-neutral-900">
            {formatCOP(price.final)}
          </span>
        )}
      </div>

      <div className="h-px w-24 bg-brand-gold" aria-hidden="true" />

      {/* Colour selector — omitted entirely for a simple product. */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <p className="font-body text-sm font-medium text-brand-text">
            Color:{' '}
            <span className="text-brand-text-soft font-normal">
              {selectedVariant?.colorName}
            </span>
          </p>
          <div
            className="flex flex-wrap gap-2.5"
            role="radiogroup"
            aria-label="Color del producto"
          >
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariant?.id;
              const soldOut = variant.stock <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${variant.colorName}${soldOut ? ' (agotado)' : ''}`}
                  title={variant.colorName}
                  onClick={() => onSelectVariant?.(variant)}
                  className={cn(
                    'focus-visible:ring-brand-gold relative size-9 rounded-full border-2 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    isSelected
                      ? 'border-brand-gold-deep scale-110'
                      : 'border-brand-line hover:border-brand-gold',
                  )}
                >
                  <span
                    className="absolute inset-1 rounded-full"
                    style={{ backgroundColor: variant.colorHex }}
                    aria-hidden="true"
                  />
                  {soldOut && (
                    // Diagonal strike marks a colour that's out of stock
                    // without removing it — the shopper still sees it exists.
                    <span
                      className="absolute inset-0 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="bg-brand-text/60 h-px w-full rotate-45" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="font-body text-xs text-brand-text-soft">
            {stock > 0 ? `${stock} disponibles en este color` : 'Agotado en este color'}
          </p>
        </div>
      )}

      {/* The description now has its own titled section below the gallery
          (see the product page) — rendering it here too would duplicate it. */}

      <div className="space-y-3">
        <label
          htmlFor="product-quantity"
          className="font-body text-sm font-medium text-brand-neutral-800"
        >
          Cantidad
        </label>
        <div className="flex w-36 items-center rounded-md border border-brand-gold/70 bg-brand-pearl">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="flex h-10 w-10 items-center justify-center text-brand-neutral-700 transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            aria-label="Disminuir cantidad"
          >
            <Minus size={15} aria-hidden="true" />
          </button>
          <input
            id="product-quantity"
            type="number"
            min={1}
            inputMode="numeric"
            value={quantity}
            onChange={handleQuantityChange}
            className="h-10 w-14 border-x border-brand-gold/40 bg-transparent text-center font-body text-sm font-medium text-brand-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            aria-label="Cantidad"
          />
          <button
            type="button"
            onClick={() => setQuantity((current) => current + 1)}
            className="flex h-10 w-10 items-center justify-center text-brand-neutral-700 transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            aria-label="Aumentar cantidad"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          className={cn(
            'w-full',
            added &&
              'bg-emerald-600 text-white hover:bg-emerald-600 dark:text-white',
          )}
          aria-live="polite"
        >
          {added ? (
            <span className="inline-flex items-center gap-2">
              <Check size={18} aria-hidden="true" />
              Agregado
            </span>
          ) : (
            'Agregar al carrito'
          )}
        </Button>

        {whatsappHref && (
          <Button asChild variant="secondary" size="lg" className="w-full">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Consultar por WhatsApp sobre ${product.name}`}
            >
              Consultar por WhatsApp
            </a>
          </Button>
        )}
      </div>

      {product.sku && (
        <p className="font-body text-xs text-brand-neutral-400">
          Ref: {product.sku}
        </p>
      )}
    </article>
  );
}
