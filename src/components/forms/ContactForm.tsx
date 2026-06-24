'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { contactSchema, type ContactFormData } from '@/lib/validators';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Error al enviar el mensaje');
      }

      setStatus('success');
      reset();
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
          ✓ Tu mensaje fue enviado. Te responderemos pronto.
        </p>
        <p className="font-sans text-sm text-emerald-700">
          Revisaremos tu mensaje y nos pondremos en contacto dentro de las
          próximas 24 horas.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStatus('idle')}
          className="mt-2 text-emerald-700 hover:text-emerald-900"
        >
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Formulario de contacto"
      className="flex flex-col gap-5"
    >
      <Input
        label="Nombre *"
        id="contact-nombre"
        autoComplete="name"
        placeholder="Tu nombre completo"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      <Input
        label="Email *"
        id="contact-email"
        type="email"
        autoComplete="email"
        placeholder="correo@ejemplo.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Teléfono (opcional)"
        id="contact-telefono"
        type="tel"
        autoComplete="tel"
        placeholder="+57 300 000 0000"
        error={errors.telefono?.message}
        {...register('telefono')}
      />

      {/* Textarea using the same styling as Input — not a separate component to stay within ui/ rules */}
      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor="contact-mensaje"
          className="font-sans text-sm font-semibold text-brand-neutral-700"
        >
          Mensaje *
        </label>
        <textarea
          id="contact-mensaje"
          rows={5}
          placeholder="¿En qué podemos ayudarte?"
          aria-describedby={
            errors.mensaje ? 'contact-mensaje-error' : undefined
          }
          className={[
            'flex w-full resize-y rounded-md border bg-brand-pearl px-3 py-2 font-sans text-sm text-brand-neutral-900 placeholder:text-brand-neutral-400',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:border-brand-gold',
            'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            errors.mensaje
              ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500'
              : 'border-brand-neutral-200',
          ].join(' ')}
          {...register('mensaje')}
        />
        {errors.mensaje && (
          <p
            id="contact-mensaje-error"
            className="font-sans text-xs text-red-500"
          >
            {errors.mensaje.message}
          </p>
        )}
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
            Enviando…
          </>
        ) : (
          'Enviar mensaje'
        )}
      </Button>
    </form>
  );
}
