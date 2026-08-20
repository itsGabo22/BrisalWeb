'use client';

import * as React from 'react';
import { Check, Flame, Minus, PackageX, Plus } from 'lucide-react';

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
  /**
   * At or below how many units of the SELECTED colour to nudge with "¡Últimas
   * N unidades disponibles!". Comes from `SiteConfig.lowStockThreshold` so the
   * client can tune it without a deploy; the default mirrors the column's.
   */
  lowStockThreshold?: number;
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

/**
 * A quantity the selected colour can actually serve.
 *
 * `max` is that colour's stock. The shopper can no longer type or step past it
 * — ordering beyond stock used to be allowed on purpose (sobrepedido) and is
 * now blocked outright, server side included, so letting the field hold an
 * unfillable number would only produce a rejection at checkout.
 */
function clampQuantity(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.min(Math.floor(value), Math.max(1, max));
}

export function ProductInfo({
  product,
  colors = [],
  selectedColor = null,
  onSelectColor,
  lowStockThreshold = 3,
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
   * Sobrepedido is gone: a colour with no stock is genuinely unbuyable now,
   * because letting customers order beyond stock risked burying the client's
   * production. The page blocks the add, and `POST /api/ordenes` re-checks the
   * same thing server-side — this number is only as fresh as the page load, so
   * the button being enabled is never the last word.
   */
  const isSoldOut = stock <= 0;
  /**
   * The one case where an exact count is still shown. Above the threshold no
   * number appears at all, which is the standing decision for this storefront;
   * at or below it, the count IS the message.
   */
  const isLowStock = stock > 0 && stock <= Math.max(1, lowStockThreshold);
  // "este color" only makes sense when the shopper actually chose one.
  const subject = colors.length > 1 ? 'Este color' : 'Este producto';
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
    setQuantity(clampQuantity(event.target.valueAsNumber, stock));
  };

  const handleAddToCart = () => {
    // Belt and braces: the button is disabled while sold out, but a stale page
    // whose colour ran out since load must not be able to add either.
    if (isSoldOut) return;

    addItem(
      {
        productId: product.id,
        name: product.name,
        // The DISCOUNTED price, so the cart charges what the page advertises.
        // This previously used the pre-discount base, which is now a real
        // difference rather than a no-op.
        price: price.final,
        // Carried so the cart can strike it through. Null when nothing was
        // discounted, which is what `original` already means here.
        originalPrice: price.original,
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

        {/* The same word and the same red the admin product list uses, so the
            client and the shopper are looking at one state, not two. */}
        {isSoldOut && <Badge variant="agotado">Agotado</Badge>}
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
                  aria-label={`${color.colorName}${soldOut ? ' (agotado)' : ''}`}
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
                    // Diagonal strike marks a colour that cannot be bought.
                    // The swatch stays clickable on purpose: the shopper has to
                    // be able to select it to read WHY it is unavailable, and
                    // an unselectable swatch just looks broken.
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
          {/* Only ever says something when there IS something to say. Exact
              counts are hidden on this storefront; "agotado" is a state the
              shopper must know, and the low-stock nudge has its own block
              below the quantity picker. */}
          {isSoldOut && (
            <p className="font-body text-xs font-medium text-red-700">
              Agotado en este color
            </p>
          )}
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
        {/*
          `max` is the selected colour's stock, and the stepper honours it — the
          shopper cannot ask for units that do not exist. The whole control goes
          inert when the colour is agotado: there is no quantity of nothing.
        */}
        <div
          className={cn(
            'flex w-36 items-center rounded-md border border-brand-gold/70 bg-brand-pearl',
            isSoldOut && 'opacity-50',
          )}
        >
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={isSoldOut || quantity <= 1}
            className="flex h-10 w-10 items-center justify-center text-brand-neutral-700 transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Disminuir cantidad"
          >
            <Minus size={15} aria-hidden="true" />
          </button>
          <input
            id="product-quantity"
            type="number"
            min={1}
            max={Math.max(1, stock)}
            disabled={isSoldOut}
            inputMode="numeric"
            value={quantity}
            onChange={handleQuantityChange}
            className="h-10 w-14 border-x border-brand-gold/40 bg-transparent text-center font-body text-sm font-medium text-brand-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:cursor-not-allowed"
            aria-label="Cantidad"
          />
          <button
            type="button"
            onClick={() => setQuantity((current) => clampQuantity(current + 1, stock))}
            disabled={isSoldOut || quantity >= stock}
            className="flex h-10 w-10 items-center justify-center text-brand-neutral-700 transition-colors hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Aumentar cantidad"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>
        {/* Says why the + stopped responding, rather than leaving a dead
            control. Only once the shopper has actually hit the ceiling. */}
        {!isSoldOut && quantity >= stock && (
          <p className="font-body text-xs text-brand-text-soft">
            Máximo disponible en este color.
          </p>
        )}
      </div>

      {/*
        Two mutually exclusive notices, in the one place where they change a
        decision — directly above "Agregar al carrito".

          • agotado    → says the colour cannot be bought, since the disabled
                         button alone does not explain itself.
          • pocas unid → the ONLY place this storefront prints an exact stock
                         number. Above `lowStockThreshold` nothing renders at
                         all, which is the standing decision to keep counts
                         private; at or below it the number IS the nudge.

        `aria-live` because both appear and change as the quantity or the
        colour changes, without the surrounding page moving.
      */}
      <div aria-live="polite">
        {isSoldOut ? (
          <div className="flex gap-2.5 rounded-md border border-red-300/60 bg-red-50 px-4 py-3">
            <PackageX size={16} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
            <p className="font-body text-sm leading-relaxed text-red-800">
              {subject} está <strong className="font-medium">agotado</strong> por
              ahora.{' '}
              {colors.length > 1
                ? 'Prueba otro color o escríbenos por WhatsApp y te avisamos cuando vuelva.'
                : 'Escríbenos por WhatsApp y te avisamos cuando vuelva a estar disponible.'}
            </p>
          </div>
        ) : (
          isLowStock && (
            <div className="border-brand-gold/40 bg-brand-gold/10 flex items-center gap-2.5 rounded-md border px-4 py-2.5">
              <Flame size={15} className="text-brand-gold-deep shrink-0" aria-hidden="true" />
              <p className="text-brand-gold-deep font-body text-sm font-medium">
                ¡Últimas {stock} {stock === 1 ? 'unidad disponible' : 'unidades disponibles'}!
              </p>
            </div>
          )
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* Disabled, not relabelled-and-still-clickable as it was under
            sobrepedido: an agotado colour is genuinely not orderable, and
            `POST /api/ordenes` now refuses the line too. */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          disabled={isSoldOut}
          className={cn(
            'w-full',
            added &&
              'bg-emerald-600 text-white hover:bg-emerald-600 dark:text-white',
          )}
          aria-live="polite"
        >
          {isSoldOut ? (
            'Agotado'
          ) : added ? (
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
