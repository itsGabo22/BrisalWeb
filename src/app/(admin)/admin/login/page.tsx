'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'PIN incorrecto');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-neutral-900">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-neutral-900 via-[#0F0E0C] to-brand-neutral-800"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(201,169,110,0.18),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(201,169,110,0.08),transparent_45%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-brand-gold/25 bg-brand-pearl shadow-[0_24px_80px_rgba(15,14,13,0.45)]">
            <div className="border-b border-brand-gold/20 bg-gradient-to-r from-brand-gold/10 via-brand-gold/5 to-transparent px-8 py-8 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-brand-gold/30 bg-white/70 text-brand-gold shadow-sm">
                <Lock className="size-6" aria-hidden="true" />
              </div>
              <p className="font-serif text-xs uppercase tracking-[0.35em] text-brand-gold">
                Acceso restringido
              </p>
              <h1
                className="mt-3 font-serif text-4xl font-medium tracking-[0.18em] text-brand-neutral-900"
                style={{ letterSpacing: '0.18em' }}
              >
                BRISAL
              </h1>
              <p className="mt-2 font-serif text-lg italic text-brand-neutral-600">
                Panel de Control
              </p>
            </div>

            <form className="space-y-6 px-8 py-8" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="pin"
                  className="block font-sans text-sm font-semibold text-brand-neutral-800"
                >
                  PIN de acceso administrador
                </label>
                <div className="relative">
                  <input
                    id="pin"
                    name="pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="current-password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Ingresa tu PIN"
                    className={cn(
                      'w-full rounded-lg border bg-white px-4 py-3.5 pr-12 font-sans text-brand-neutral-900 shadow-sm',
                      'placeholder:text-brand-neutral-400',
                      'focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/25',
                      error
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200/40'
                        : 'border-brand-neutral-200',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-neutral-400 transition-colors hover:text-brand-neutral-700"
                    aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showPin ? (
                      <EyeOff className="size-5" aria-hidden="true" />
                    ) : (
                      <Eye className="size-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {error ? (
                  <p className="font-sans text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : (
                  <p className="font-sans text-xs text-brand-neutral-500">
                    Solo personal autorizado de Brisal by Salvador.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading || !pin}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-brand-neutral-900 border-t-transparent" />
                ) : (
                  <>
                    <Sparkles className="size-4" aria-hidden="true" />
                    <span>Ingresar al panel</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center font-sans text-sm text-brand-neutral-400">
            <Link
              href="/"
              className="transition-colors hover:text-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-neutral-900 rounded-sm"
            >
              ← Volver a la tienda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
