'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

import { mayoristaLoginSchema, type MayoristaLoginFormData } from '@/lib/validators';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function MayoristaLoginPage() {
  return (
    <React.Suspense fallback={null}>
      <MayoristaLoginForm />
    </React.Suspense>
  );
}

function MayoristaLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get('email') ?? '';
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MayoristaLoginFormData>({
    resolver: zodResolver(mayoristaLoginSchema),
    defaultValues: { email: prefilledEmail },
  });

  const onSubmit = async ({ email, password }: MayoristaLoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error('Correo o contraseña incorrectos.');
      }

      const res = await fetch('/api/auth/session');
      const session = (await res.json()) as { authenticated: boolean; approved: boolean };

      if (!session.authenticated) {
        throw new Error('No se encontró una cuenta mayorista asociada a este correo.');
      }

      router.push(session.approved ? '/catalogo' : '/mayoristas/pendiente');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-block font-body text-sm text-brand-neutral-500 transition-colors hover:text-brand-gold"
        >
          ← Volver al inicio
        </Link>

        <div className="rounded-2xl border border-brand-neutral-100 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <h1 className="mb-2 font-heading text-2xl font-normal text-brand-text">
            Acceso Mayorista
          </h1>
          <p className="mb-8 font-body text-sm text-brand-neutral-600">
            Ingresa con tu correo y contraseña.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <Input
              label="Email *"
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="correo@negocio.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Contraseña *"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-brand-neutral-400 transition-colors hover:text-brand-neutral-700"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                <p className="font-body text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-body text-sm text-brand-neutral-500">
          ¿Aún no tienes cuenta?{' '}
          <Link
            href="/registro-mayorista"
            className="font-medium text-brand-gold hover:underline"
          >
            Registrarme
          </Link>
        </p>

        <Link
          href="/"
          className="mt-8 block text-center font-body text-sm text-brand-neutral-500 transition-colors hover:text-brand-gold"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
