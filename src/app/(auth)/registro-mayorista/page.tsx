import type { Metadata } from 'next';
import Link from 'next/link';

import { WholesaleForm } from '@/components/forms/WholesaleForm';

export const metadata: Metadata = {
  title: 'Registro Mayorista | Brisal by Salvador',
  description: 'Crea tu cuenta mayorista para acceder a precios preferenciales.',
};

export default function RegistroMayoristaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-block font-body text-sm text-brand-neutral-500 transition-colors hover:text-brand-gold"
        >
          ← Volver al inicio
        </Link>

        <div className="rounded-2xl border border-brand-neutral-100 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <h1 className="mb-2 font-heading text-2xl font-normal text-brand-text">
            Registro Mayorista
          </h1>
          <p className="mb-8 font-body text-sm text-brand-neutral-600">
            Crea tu cuenta para solicitar acceso mayorista. Nuestro equipo
            revisará tu solicitud antes de habilitar el acceso.
          </p>
          <WholesaleForm />
        </div>

        <p className="mt-6 text-center font-body text-sm text-brand-neutral-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-brand-gold hover:underline">
            Inicia sesión
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
