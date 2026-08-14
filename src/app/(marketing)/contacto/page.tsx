import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';

import { CatalogHeader } from '@/components/catalog/CatalogHeader';
import { ContactForm } from '@/components/forms/ContactForm';
import {
  CONTACT_ADDRESS_LINES,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
} from '@/lib/constants/contact';

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
              <h2 className="font-heading text-2xl font-medium text-brand-text">
                Información de contacto
              </h2>
              <p className="mt-2 font-body text-sm text-brand-neutral-600">
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
                  <p className="font-body text-xs font-medium uppercase tracking-widest text-brand-neutral-500">
                    Email
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-0.5 font-body text-sm text-brand-neutral-800 hover:text-brand-gold transition-colors break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
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
                  <p className="font-body text-xs font-medium uppercase tracking-widest text-brand-neutral-500">
                    Teléfono / WhatsApp
                  </p>
                  {/* `tel:` rather than the `wa.me` link this used to build.
                      The floating button and the order flow are already the
                      site's WhatsApp entry points; this line is the one place
                      a visitor can simply CALL the store, which nothing else
                      offered. Same number either way. */}
                  <a
                    href={`tel:+${CONTACT_PHONE_E164}`}
                    className="mt-0.5 font-body text-sm text-brand-neutral-800 hover:text-brand-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                  >
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/10">
                  <MapPin className="h-5 w-5 text-brand-gold" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-body text-xs font-medium uppercase tracking-widest text-brand-neutral-500">
                    Dirección
                  </p>
                  <address className="mt-0.5 font-body text-sm text-brand-neutral-800 not-italic">
                    {CONTACT_ADDRESS_LINES.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
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
                  <p className="font-body text-xs font-medium uppercase tracking-widest text-brand-neutral-500">
                    Tiempo de respuesta
                  </p>
                  <p className="mt-0.5 font-body text-sm text-brand-neutral-800">
                    Respondemos en menos de 24 horas
                  </p>
                </div>
              </li>
            </ul>

            <p className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-4 py-3 font-body text-sm text-brand-neutral-700">
              También puedes escribirnos directamente por WhatsApp usando el
              botón flotante en la esquina inferior derecha.
            </p>
          </aside>

          {/* ── Right column: form (60%) ─────────────────────────────── */}
          <div className="lg:w-3/5">
            <h2 className="font-heading text-2xl font-medium text-brand-text mb-6">
              Envíanos un mensaje
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
