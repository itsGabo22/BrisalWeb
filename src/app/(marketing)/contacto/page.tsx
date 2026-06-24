import type { Metadata } from 'next';
import { Mail, Phone, Clock } from 'lucide-react';

import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { ContactForm } from '@/components/forms/ContactForm';

// ─── Contact constants — avoid hardcoding in JSX ─────────────────────────────
const CONTACT_EMAIL = 'contacto@brisalbysalvador.com';
const CONTACT_PHONE = '+57 300 000 0000';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contacto | Brisal by Salvador',
    description:
      'Contáctanos para resolver tus dudas sobre nuestros accesorios premium. Respondemos en menos de 24 horas.',
  };
}

export default function ContactoPage() {
  return (
    <main>
      <CatalogHeader
        title="Contáctanos"
        subtitle="Estamos para ayudarte"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Contacto' },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          {/* ── Left column: contact info (40%) ─────────────────────── */}
          <aside className="flex flex-col gap-8 lg:w-2/5">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-brand-neutral-900">
                Información de contacto
              </h2>
              <p className="mt-2 font-sans text-sm text-brand-neutral-600">
                Puedes escribirnos directamente o usar el formulario. Te
                responderemos a la brevedad.
              </p>
            </div>

            <ul className="flex flex-col gap-6" role="list">
              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/10">
                  <Mail
                    className="h-5 w-5 text-brand-gold"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-neutral-500">
                    Email
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-0.5 font-sans text-sm text-brand-neutral-800 hover:text-brand-gold transition-colors break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/10">
                  <Phone
                    className="h-5 w-5 text-brand-gold"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-neutral-500">
                    Teléfono / WhatsApp
                  </p>
                  <a
                    href={`https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 font-sans text-sm text-brand-neutral-800 hover:text-brand-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                  >
                    {CONTACT_PHONE}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/10">
                  <Clock
                    className="h-5 w-5 text-brand-gold"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-brand-neutral-500">
                    Tiempo de respuesta
                  </p>
                  <p className="mt-0.5 font-sans text-sm text-brand-neutral-800">
                    Respondemos en menos de 24 horas
                  </p>
                </div>
              </li>
            </ul>

            <p className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-4 py-3 font-sans text-sm text-brand-neutral-700">
              También puedes escribirnos directamente por WhatsApp usando el
              botón flotante en la esquina inferior derecha.
            </p>
          </aside>

          {/* ── Right column: form (60%) ─────────────────────────────── */}
          <div className="lg:w-3/5">
            <h2 className="font-serif text-2xl font-semibold text-brand-neutral-900 mb-6">
              Envíanos un mensaje
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
