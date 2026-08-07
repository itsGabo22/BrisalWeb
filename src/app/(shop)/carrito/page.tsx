'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { formatCOP } from '@/lib/utils/pricing';
import { useCartStore } from '@/stores/cartStore';

export default function CartPage() {
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.getTotal());

  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [wholesaleUserId, setWholesaleUserId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = (await res.json()) as { approved: boolean; userId: string | null };
          if (data.approved) setWholesaleUserId(data.userId);
        }
      } catch {
        // Not logged in as wholesaler — fine, order proceeds without wholesaleUserId.
      }
    });
  }, []);

  const handleClearCart = () => {
    clearCart();
    setConfirmClearOpen(false);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setSubmitError('Completa tu nombre y teléfono para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          })),
          total,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          wholesaleUserId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? 'No se pudo generar el pedido');
      }

      const data = (await res.json()) as { whatsappUrl: string };
      clearCart();
      window.location.href = data.whatsappUrl;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmpty = items.length === 0;

  return (
    <main className="bg-brand-pearl">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <nav
          aria-label="Breadcrumb"
          className="text-brand-neutral-500 mb-4 flex items-center gap-2 font-body text-sm"
        >
          <Link href="/" className="hover:text-brand-gold transition-colors">
            Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-brand-neutral-800">Carrito</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-brand-text font-heading text-4xl font-medium md:text-5xl">
            Tu carrito
          </h1>
        </div>

        {isEmpty ? (
          <Card className="mx-auto max-w-xl bg-white/80">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">
              <div className="border-brand-gold/30 bg-brand-gold/10 text-brand-gold mb-5 flex size-16 items-center justify-center rounded-full border">
                <ShoppingBag size={30} aria-hidden="true" />
              </div>
              <h2 className="text-brand-text font-heading text-2xl font-medium">
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
                        className="text-brand-neutral-900 hover:text-brand-gold font-body text-base font-medium transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-brand-neutral-600 mt-1 font-body text-sm">
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
                          <span className="text-brand-neutral-900 w-9 text-center font-body text-sm font-medium">
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
                      <p className="text-brand-neutral-500 font-body text-sm">
                        Subtotal
                      </p>
                      <p className="text-brand-neutral-900 font-body text-lg font-medium">
                        {formatCOP(item.price * item.quantity)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="font-body text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
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
                      className="flex items-start justify-between gap-4 font-body text-sm"
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
                  <span className="text-brand-neutral-900 font-body text-base font-medium">
                    Total
                  </span>
                  <span className="text-brand-gold font-body text-2xl font-medium">
                    {formatCOP(total)}
                  </span>
                </div>

                <p className="text-brand-neutral-500 mt-4 font-body text-xs leading-relaxed">
                  Los precios no incluyen envío. El envío se coordina
                  directamente con el vendedor.
                </p>

                <form onSubmit={handleSubmitOrder} className="mt-6 space-y-4" noValidate>
                  <Input
                    label="Nombre *"
                    id="customer-name"
                    autoComplete="name"
                    placeholder="Tu nombre completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <Input
                    label="Teléfono *"
                    id="customer-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+57 300 000 0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />

                  {submitError && (
                    <p className="font-body text-sm text-red-600" role="alert">
                      {submitError}
                    </p>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando…' : 'Solicitar pedido por WhatsApp'}
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/catalogo">Seguir comprando</Link>
                    </Button>
                  </div>
                </form>
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
