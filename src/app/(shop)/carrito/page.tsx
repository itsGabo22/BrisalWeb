'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatCOP } from '@/lib/utils/pricing';
import { useCartStore } from '@/stores/cartStore';

const WHATSAPP_UNCONFIGURED = 'WhatsApp no configurado';

function buildWhatsAppMessage(
  items: ReturnType<typeof useCartStore.getState>['items'],
  total: number,
) {
  const itemLines = items
    .map(
      (item) =>
        `- ${item.name} x ${item.quantity} = ${formatCOP(item.price * item.quantity)}`,
    )
    .join('\n');

  return `Hola, quiero hacer el siguiente pedido:\n\n${itemLines}\n\nTotal: ${formatCOP(total)}\n\n¿Pueden confirmarme disponibilidad y envío?`;
}

export default function CartPage() {
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.getTotal());
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  const whatsAppHref = React.useMemo(() => {
    if (!whatsappNumber || items.length === 0) return null;

    const message = buildWhatsAppMessage(items, total);
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [items, total, whatsappNumber]);

  const handleClearCart = () => {
    clearCart();
    setConfirmClearOpen(false);
  };

  const isEmpty = items.length === 0;

  return (
    <main className="bg-brand-pearl">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <nav
          aria-label="Breadcrumb"
          className="text-brand-neutral-500 mb-4 flex items-center gap-2 font-sans text-sm"
        >
          <Link href="/" className="hover:text-brand-gold transition-colors">
            Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-brand-neutral-800">Carrito</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-brand-neutral-900 font-serif text-4xl font-medium md:text-5xl">
            Tu carrito
          </h1>
        </div>

        {isEmpty ? (
          <Card className="mx-auto max-w-xl bg-white/80">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">
              <div className="border-brand-gold/30 bg-brand-gold/10 text-brand-gold mb-5 flex size-16 items-center justify-center rounded-full border">
                <ShoppingBag size={30} aria-hidden="true" />
              </div>
              <h2 className="text-brand-neutral-900 font-serif text-2xl font-medium">
                Tu carrito está vacío
              </h2>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/catalogo">Explorar catálogo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section aria-label="Productos en el carrito" className="space-y-4">
              {items.map((item) => (
                <Card key={item.productId} className="bg-white/80">
                  <CardContent className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-center">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="size-20 rounded-md object-cover"
                    />

                    <div className="min-w-0">
                      <Link
                        href={`/producto/${item.slug}`}
                        className="text-brand-neutral-900 hover:text-brand-gold font-sans text-base font-semibold transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-brand-neutral-600 mt-1 font-sans text-sm">
                        {formatCOP(item.price)} unidad
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        <div
                          className="border-brand-neutral-200 inline-flex h-9 items-center rounded-md border bg-white"
                          aria-label={`Cantidad de ${item.name}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold flex size-9 items-center justify-center rounded-l-md transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Disminuir cantidad de ${item.name}`}
                          >
                            <Minus size={15} aria-hidden="true" />
                          </button>
                          <span className="text-brand-neutral-900 w-9 text-center font-sans text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold flex size-9 items-center justify-center rounded-r-md transition-colors"
                            aria-label={`Aumentar cantidad de ${item.name}`}
                          >
                            <Plus size={15} aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-brand-neutral-500 flex size-9 items-center justify-center rounded-md transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2 text-right sm:col-span-1">
                      <p className="text-brand-neutral-500 font-sans text-sm">
                        Subtotal
                      </p>
                      <p className="text-brand-neutral-900 font-sans text-lg font-semibold">
                        {formatCOP(item.price * item.quantity)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="font-sans text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
              >
                Vaciar carrito
              </button>
            </section>

            <Card className="border-brand-gold/35 bg-brand-pearl h-fit">
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-start justify-between gap-4 font-sans text-sm"
                    >
                      <span className="text-brand-neutral-700">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="text-brand-neutral-900 shrink-0 font-medium">
                        {formatCOP(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className="bg-brand-gold/35 my-5 h-px"
                  aria-hidden="true"
                />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-brand-neutral-900 font-sans text-base font-semibold">
                    Total
                  </span>
                  <span className="text-brand-gold font-sans text-2xl font-bold">
                    {formatCOP(total)}
                  </span>
                </div>

                <p className="text-brand-neutral-500 mt-4 font-sans text-xs leading-relaxed">
                  Los precios no incluyen envío. El envío se coordina
                  directamente con el vendedor.
                </p>

                <div className="mt-6 space-y-3">
                  <span
                    className="block"
                    title={!whatsAppHref ? WHATSAPP_UNCONFIGURED : undefined}
                  >
                    <Button
                      className="w-full"
                      disabled={!whatsAppHref}
                      onClick={() => {
                        if (whatsAppHref)
                          window.open(
                            whatsAppHref,
                            '_blank',
                            'noopener,noreferrer',
                          );
                      }}
                    >
                      Solicitar pedido por WhatsApp
                    </Button>
                  </span>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/catalogo">Seguir comprando</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <Modal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="¿Estás seguro?"
        description="Esto eliminará todos los productos del carrito."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmClearOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleClearCart}
          >
            Vaciar carrito
          </Button>
        </div>
      </Modal>
    </main>
  );
}
