'use client';

import * as React from 'react';
import { Check, Clock, Minus, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';
import {
  formatCOP,
  getEffectivePrice,
  hasWholesalePrice,
  productForVariant,
} from '@/lib/utils/pricing';
import { getProductReference } from '@/lib/utils/product-reference';
import type { SelectableColor } from '@/lib/utils/product-options';
import { useWholesaleSession } from '@/hooks/useWholesaleSession';
import type { Product, Tag } from '@/types';

interface ProductInfoProps {
  product: Product;
  /** Primary colour first, then variants. Empty for a colourless product. */
  colors?: SelectableColor[];
  selectedColor?: SelectableColor | null;
  onSelectColor?: (color: SelectableColor) => void;
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
  colors = [],
  selectedColor = null,
  onSelectColor,
}: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const wholesaleSession = useWholesaleSession();

  /**
   * A different colour is effectively a different selection, so carrying a
   * quantity across the change is confusing — "2" chosen for Dorado should not
   * silently become "2 Plateado". Reset during render, keyed on the selected
   * colour, rather than in an effect: React re-runs immediately with the
   * corrected value and never paints the stale quantity.
   */
  const [quantityColorId, setQuantityColorId] = React.useState(selectedColor?.id ?? null);
  if (quantityColorId !== (selectedColor?.id ?? null)) {
    setQuantityColorId(selectedColor?.id ?? null);
    setQuantity(1);
  }

  /**
   * The product re-priced for the chosen colour. Everything below then works
   * on a normal Product, so discounts and wholesale gating need no knowledge
   * of colours at all.
   */
  const priced = productForVariant(product, selectedColor?.variant ?? null);
  const showWholesalePrice =
    wholesaleSession === 'approved' && hasWholesalePrice(priced);
  const price = getEffectivePrice(priced, showWholesalePrice);
  const stock = Math.max(0, selectedColor ? selectedColor.stock : product.stock);
  /**
   * Sobrepedido: a colour with too little stock is still orderable — the client
   * produces or restocks the difference — so the page never blocks the add. It
   * says so instead, and the same arithmetic is redone server-side at order
   * time (see `computeBackorderQty`), because this stock number is only as
   * fresh as the page load.
   */
  const backorderQty = Math.max(0, quantity - stock);
  const isSoldOut = stock <= 0;
  const isBackorder = backorderQty > 0;
  // "este color" only makes sense when the shopper actually chose one.
  const subject = colors.length > 1 ? 'Este color está' : 'Este producto está';
  // Changes with the selected colour, so the shopper and the client are always
  // looking at the same reference for the same thing.
  const reference = selectedColor?.reference ?? getProductReference(product);
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
          selectedColor?.imageUrls[0] ?? product.imageUrls[0] ?? '',
        slug: product.slug,
        color: selectedColor?.colorName ?? null,
        // Null for the primary colour, whose stock is the product's own — see
        // `resolveLineVariant`, which reads that null the same way.
        colorVariantId: selectedColor?.variant?.id ?? null,
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

  /**
   * The origin — empty on the server AND through hydration, real afterwards.
   *
   * This used to be `typeof window === 'undefined' ? path : origin + path`
   * evaluated during render, which is a guaranteed hydration mismatch: the
   * server produced a relative link and the client an absolute one, so the two
   * trees disagreed on the href and React warned on every product page.
   *
   * `useSyncExternalStore` is the sanctioned way to read a browser-only value
   * without that mismatch — React uses the server snapshot while hydrating and
   * only then switches to the client one, so the first paint matches by
   * construction. The subscribe callback is a no-op because the origin cannot
   * change without a full navigation.
   *
   * The link stays a real href throughout, so middle-click and "copy link
   * address" keep working — which an onClick-only fix would have broken.
   */
  const origin = React.useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => '',
  );

  const productUrl = `${origin}/producto/${product.slug}`;
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

        {/* Shown as soon as the colour is empty — before the shopper commits to
            a quantity — so "sobre pedido" is never a surprise at checkout. */}
        {isSoldOut && <Badge variant="sobre-pedido">Sobre pedido</Badge>}
      </div>

      <div className="h-px w-24 bg-brand-gold" aria-hidden="true" />

      {/*
        Colour block. Three states:
          • no colours at all  → nothing renders, exactly as a plain product
          • exactly ONE colour → a labelled swatch, NOT a radiogroup. A single
            radio option is a control that can't do anything; the shopper only
            needs to be told the colour.
          • two or more       → the full selector, primary first.
      */}
      {colors.length === 1 && (
        <div className="flex items-center gap-2">
          <span
            className="border-brand-line size-5 shrink-0 rounded-full border"
            style={{ backgroundColor: colors[0].colorHex }}
            aria-hidden="true"
          />
          <p className="font-body text-sm font-medium text-brand-text">
            Color:{' '}
            <span className="text-brand-text-soft font-normal">
              {colors[0].colorName}
            </span>
          </p>
        </div>
      )}

      {colors.length > 1 && (
        <div className="space-y-3">
          <p className="font-body text-sm font-medium text-brand-text">
            Color:{' '}
            <span className="text-brand-text-soft font-normal">
              {selectedColor?.colorName}
            </span>
          </p>
          <div
            className="flex flex-wrap gap-2.5"
            role="radiogroup"
            aria-label="Color del producto"
          >
            {colors.map((color) => {
              const isSelected = color.id === selectedColor?.id;
              const soldOut = color.stock <= 0;
              return (
                <button
                  key={color.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${color.colorName}${soldOut ? ' (sobre pedido)' : ''}`}
                  title={color.colorName}
                  onClick={() => onSelectColor?.(color)}
                  className={cn(
                    'focus-visible:ring-brand-gold relative size-9 rounded-full border-2 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    isSelected
                      ? 'border-brand-gold-deep scale-110'
                      : 'border-brand-line hover:border-brand-gold',
                  )}
                >
                  <span
                    className="absolute inset-1 rounded-full"
                    style={{ backgroundColor: color.colorHex }}
                    aria-hidden="true"
                  />
                  {soldOut && (
                    // Diagonal strike marks a colour with no stock without
                    // disabling it — it is still orderable, on sobrepedido.
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
            {stock > 0
              ? `${stock} disponibles en este color`
              : 'Sin stock en este color — se hace sobre pedido'}
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

      {/*
        The sobrepedido notice. It sits directly above "Agregar al carrito"
        because that is the moment it changes a decision — the shopper is told
        what ordering more than exists means BEFORE they do it, and the button
        stays enabled, which is the point of the whole feature.

        `aria-live` because the message appears and changes as the quantity or
        the colour changes, without the surrounding page moving.
      */}
      <div aria-live="polite">
        {isBackorder && (
          <div className="border-badge-sobrepedido-fg/25 bg-badge-sobrepedido-bg flex gap-2.5 rounded-md border px-4 py-3">
            <Clock
              size={16}
              className="text-badge-sobrepedido-fg mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-badge-sobrepedido-fg font-body text-sm leading-relaxed">
              {isSoldOut ? (
                <>
                  {subject} <strong className="font-medium">sobre pedido</strong>. Tu
                  pedido se procesará y coordinaremos el tiempo de entrega por
                  WhatsApp.
                </>
              ) : (
                <>
                  Tenemos <strong className="font-medium">{stock}</strong>{' '}
                  {stock === 1 ? 'unidad disponible' : 'unidades disponibles'} de
                  inmediato. {backorderQty === 1 ? 'La otra unidad queda' : `Las otras ${backorderQty} unidades quedan`}{' '}
                  <strong className="font-medium">sobre pedido</strong> y
                  coordinaremos el tiempo de entrega por WhatsApp.
                </>
              )}
            </p>
          </div>
        )}
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
