'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

// WhatsApp number read from env — NEVER hardcoded (matches src/components/layout/WhatsAppButton.tsx).
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hola, quisiera consultar el estado de mi solicitud de cuenta mayorista en Brisal by Salvador.',
);

export default function MayoristaPendientePage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-brand-neutral-100 bg-white px-6 py-10 shadow-sm sm:px-10">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
          <Clock className="size-6" aria-hidden="true" />
        </div>

        <h1 className="mb-2 font-heading text-2xl font-normal text-brand-text">
          Solicitud en revisión
        </h1>
        <p className="mb-8 font-body text-sm text-brand-neutral-600">
          Tu solicitud está siendo revisada por nuestro equipo. Te
          notificaremos por correo cuando tu cuenta mayorista sea aprobada.
        </p>

        {WHATSAPP_NUMBER && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-body text-sm font-medium text-white transition-colors hover:bg-[#1ebe57]"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Consultar por WhatsApp
          </a>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full"
        >
          Cerrar sesión
        </Button>
      </div>

      <Link
        href="/"
        className="mt-8 font-body text-sm text-brand-neutral-500 transition-colors hover:text-brand-gold"
      >
        ← Volver al inicio
      </Link>
    </main>
  );
}
