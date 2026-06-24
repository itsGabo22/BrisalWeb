'use client';

import * as React from 'react';
import { Check, Minus, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';
import { formatCOP, hasActiveSalePrice } from '@/lib/utils/pricing';
import type { Product, Tag } from '@/types';

interface ProductInfoProps {
  product: Product;
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

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const onSale = hasActiveSalePrice(product);
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
        price: product.price,
        imageUrl: product.imageUrls[0] ?? '',
        slug: product.slug,
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
        <h1 className="font-serif text-3xl font-semibold leading-tight text-brand-neutral-900 sm:text-4xl">
          {product.name}
        </h1>

        {product.material && (
          <p className="font-sans text-sm text-brand-neutral-500">
            Material: {product.material}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3" aria-label="Precio">
        {onSale && product.comparePrice ? (
          <>
            <span className="font-sans text-sm text-brand-neutral-400 line-through">
              {formatCOP(product.comparePrice)}
            </span>
            <span className="font-sans text-2xl font-semibold text-brand-gold">
              {formatCOP(product.price)}
            </span>
            <Badge variant="en-oferta">En oferta</Badge>
          </>
        ) : (
          <span className="font-sans text-2xl font-semibold text-brand-neutral-900">
            {formatCOP(product.price)}
          </span>
        )}
      </div>

      <div className="h-px w-24 bg-brand-gold" aria-hidden="true" />

      {product.description && (
        <p className="font-sans text-base leading-7 text-brand-neutral-600">
          {product.description}
        </p>
      )}

      <div className="space-y-3">
        <label
          htmlFor="product-quantity"
          className="font-sans text-sm font-medium text-brand-neutral-800"
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
            className="h-10 w-14 border-x border-brand-gold/40 bg-transparent text-center font-sans text-sm font-semibold text-brand-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
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
        <p className="font-sans text-xs text-brand-neutral-400">
          Ref: {product.sku}
        </p>
      )}
    </article>
  );
}
