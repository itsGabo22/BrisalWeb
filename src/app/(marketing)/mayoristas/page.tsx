import type { Metadata } from 'next';
import { Tag, BookOpen, Users } from 'lucide-react';

import { WholesaleForm } from '@/components/forms/WholesaleForm';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mayoristas | Brisal by Salvador',
    description:
      'Accede a precios exclusivos y condiciones especiales para tu negocio. Regístrate como mayorista de Brisal by Salvador.',
  };
}

const BENEFITS = [
  {
    icon: Tag,
    title: 'Precios preferenciales',
    description:
      'Accede a tarifas especiales en toda nuestra colección de accesorios premium en acero y rodio.',
  },
  {
    icon: BookOpen,
    title: 'Catálogo exclusivo',
    description:
      'Consulta productos y referencias disponibles exclusivamente para distribuidores y mayoristas registrados.',
  },
  {
    icon: Users,
    title: 'Atención personalizada',
    description:
      'Un asesor dedicado para acompañarte en tus pedidos, reposiciones y cualquier consulta comercial.',
  },
] as const;

export default function MayoristasPage() {
  return (
    <main>
      {/* ── Hero corto ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-brand-neutral-900 px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        aria-labelledby="mayoristas-hero-heading"
      >
        {/* Subtle decorative gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(204,164,45,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">
            Programa exclusivo
          </p>
          <h1
            id="mayoristas-hero-heading"
            className="font-serif text-4xl font-bold leading-tight text-brand-pearl sm:text-5xl"
          >
            Programa para Mayoristas
          </h1>
          <p className="mt-4 font-sans text-base leading-relaxed text-brand-neutral-300 sm:text-lg">
            Accede a precios exclusivos y condiciones especiales para tu
            negocio.
          </p>
        </div>
      </section>

      {/* ── Beneficios ─────────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
        aria-labelledby="mayoristas-benefits-heading"
      >
        <h2
          id="mayoristas-benefits-heading"
          className="mb-10 text-center font-serif text-3xl font-semibold text-brand-neutral-900"
        >
          ¿Por qué ser mayorista Brisal?
        </h2>

        <div className="grid gap-8 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="flex flex-col items-center gap-4 rounded-xl border border-brand-neutral-100 bg-white p-8 text-center shadow-sm"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/10">
                <Icon className="h-7 w-7 text-brand-gold" aria-hidden="true" />
              </span>
              <h3 className="font-serif text-xl font-semibold text-brand-neutral-900">
                {title}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-brand-neutral-600">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Formulario ─────────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24"
        aria-labelledby="mayoristas-form-heading"
      >
        {/* White/pearl card for maximum form legibility — no glassmorphism per spec */}
        <div className="rounded-2xl border border-brand-neutral-100 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <h2
            id="mayoristas-form-heading"
            className="mb-2 font-serif text-2xl font-semibold text-brand-neutral-900"
          >
            Solicita tu registro
          </h2>
          <p className="mb-8 font-sans text-sm text-brand-neutral-600">
            Completa el formulario y nuestro equipo comercial se comunicará
            contigo en un plazo máximo de 48 horas hábiles.
          </p>
          <WholesaleForm />
        </div>
      </section>
    </main>
  );
}
