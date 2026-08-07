import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag, BookOpen, Users } from 'lucide-react';

import { WholesaleForm } from '@/components/forms/WholesaleForm';
import { CategoryIcon } from '@/components/marketing';
import { categoryRepository } from '@/lib/repositories';

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

// Decorative fallback icon letters if image hasn't been uploaded yet
const FALLBACK_ICONS: Record<string, string> = {
  aretes: '✨',
  collares: '📿',
  pulseras: '🎗️',
  brazaletes: '💫',
  anillos: '💍',
  prendedores: '🌸',
  accesorios: '👜',
  belleza: '💄',
};

export default async function MayoristasPage() {
  const allCategories = await categoryRepository.getAll();
  const rootCategories = allCategories.filter((cat) => cat.parentId === null);

  return (
    <main>
      {/* ── Hero corto ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-brand-sand px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        aria-labelledby="mayoristas-hero-heading"
      >
        {/* Subtle decorative gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,169,110,0.22) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 font-body text-xs font-medium uppercase tracking-[0.25em] text-brand-gold-deep">
            Programa exclusivo
          </p>
          <h1
            id="mayoristas-hero-heading"
            className="font-heading text-4xl font-medium leading-tight text-brand-text sm:text-5xl"
          >
            Programa para Mayoristas
          </h1>
          <p className="mt-4 font-body text-base leading-relaxed text-brand-text-soft sm:text-lg">
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
          className="mb-10 text-center font-heading text-3xl font-medium text-brand-text"
        >
          ¿Por qué ser mayorista Brisal?
        </h2>

        <div className="grid gap-8 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="flex flex-col items-center gap-4 rounded-xl border border-brand-line bg-brand-pearl p-8 text-center shadow-sm"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/10">
                <Icon className="h-7 w-7 text-brand-gold-deep" aria-hidden="true" />
              </span>
              <h3 className="font-heading text-xl font-medium text-brand-text">
                {title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-brand-text-soft">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Categorías que ofrecemos ───────────────────────────────── */}
      <section
        className="border-y border-brand-line bg-brand-sand/60 py-14 lg:py-20"
        aria-labelledby="mayoristas-categories-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2
              id="mayoristas-categories-heading"
              className="font-heading text-3xl font-medium text-brand-text"
            >
              Nuestras categorías de productos
            </h2>
            <p className="mt-3 font-body text-sm text-brand-text-soft">
              Contamos con una amplia variedad de accesorios premium disponibles para distribución.
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {rootCategories.map((category) => {
              const fallbackEmoji = FALLBACK_ICONS[category.slug] || '✨';

              return (
                <Link
                  key={category.id}
                  href={`/catalogo/${category.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-brand-line bg-brand-pearl p-5 shadow-xs transition-all hover:border-brand-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-cream transition-colors group-hover:bg-brand-gold/10">
                    {/* 
                      Note for Gabriel (USER): Please upload the PNG icons to 'public/icons/categories/cat-[slug].png'
                      Example: 'public/icons/categories/cat-aretes.png'
                    */}
                    <div className="absolute inset-0 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform select-none">
                      <CategoryIcon
                        slug={category.slug}
                        name={category.name}
                        fallbackEmoji={fallbackEmoji}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading text-base font-medium text-brand-text group-hover:text-brand-gold-deep transition-colors">
                      {category.name}
                    </h3>
                    <span className="font-body text-[11px] text-brand-text-soft group-hover:text-brand-text transition-colors">
                      Ver catálogo &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Formulario ─────────────────────────────────────────────── */}
      <section
        className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        aria-labelledby="mayoristas-form-heading"
      >
        {/* White/pearl card for maximum form legibility — no glassmorphism per spec */}
        <div className="rounded-2xl border border-brand-line bg-brand-pearl px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <h2
            id="mayoristas-form-heading"
            className="mb-2 font-heading text-2xl font-medium text-brand-text"
          >
            Solicita tu registro
          </h2>
          <p className="mb-8 font-body text-sm text-brand-text-soft">
            Crea tu cuenta mayorista. Nuestro equipo comercial revisará tu
            solicitud y habilitará tu acceso en un plazo máximo de 48 horas
            hábiles.
          </p>
          <WholesaleForm />
        </div>
      </section>
    </main>
  );
}
