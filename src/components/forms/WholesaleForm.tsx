'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

import {
  registroMayoristaSchema,
  type RegistroMayoristaFormData,
} from '@/lib/validators';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function WholesaleForm() {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroMayoristaFormData>({
    resolver: zodResolver(registroMayoristaSchema),
  });

  const onSubmit = async (data: RegistroMayoristaFormData) => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/registro-mayorista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Error al crear la cuenta');
      }

      setStatus('success');
      setTimeout(() => router.push('/mayoristas/pendiente'), 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-8 text-center"
      >
        <CheckCircle
          className="h-10 w-10 text-emerald-500"
          aria-hidden="true"
        />
        <p className="font-sans text-base font-semibold text-emerald-800">
          ✓ Tu cuenta fue creada. Nuestro equipo revisará tu solicitud antes
          de habilitar el acceso mayorista.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Formulario de solicitud de mayorista"
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Nombre completo *"
          id="wholesale-nombre"
          autoComplete="name"
          placeholder="Tu nombre completo"
          error={errors.nombre?.message}
          {...register('nombre')}
        />

        <Input
          label="Nombre del negocio *"
          id="wholesale-nombreNegocio"
          autoComplete="organization"
          placeholder="Accesorios XYZ"
          error={errors.nombreNegocio?.message}
          {...register('nombreNegocio')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="NIT o Cédula *"
          id="wholesale-nitCedula"
          placeholder="900123456-7"
          error={errors.nitCedula?.message}
          {...register('nitCedula')}
        />

        <Input
          label="Ciudad *"
          id="wholesale-ciudad"
          autoComplete="address-level2"
          placeholder="Bogotá, Medellín…"
          error={errors.ciudad?.message}
          {...register('ciudad')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Email *"
          id="wholesale-email"
          type="email"
          autoComplete="email"
          placeholder="correo@negocio.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Teléfono *"
          id="wholesale-telefono"
          type="tel"
          autoComplete="tel"
          placeholder="+57 300 000 0000"
          error={errors.telefono?.message}
          {...register('telefono')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Contraseña *"
          id="wholesale-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="relative">
          <Input
            label="Confirmar contraseña *"
            id="wholesale-confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-9 text-brand-neutral-400 transition-colors hover:text-brand-neutral-700"
            aria-label={showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {status === 'error' && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1">
            <p className="font-sans text-sm font-medium text-red-800">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="font-sans text-xs text-red-600 underline hover:text-red-800 text-left"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={status === 'loading'}
        aria-busy={status === 'loading'}
        className="w-full sm:w-auto sm:self-start"
      >
        {status === 'loading' ? (
          <>
            <Loader2
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
            Creando cuenta…
          </>
        ) : (
          'Crear cuenta mayorista'
        )}
      </Button>
    </form>
  );
}
