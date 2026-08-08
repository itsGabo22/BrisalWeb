import * as React from 'react';
import Link from 'next/link';
// lucide-react v1.x does not export Instagram or Facebook — using inline SVGs
function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ─── Configurable constants ───────────────────────────────────────────────────
const CONTACT_EMAIL = 'contacto@brisalbysalvador.com';
const CONTACT_PHONE = '+57 300 000 0000';
const COPYRIGHT_YEAR = 2026;

// ─── TikTok icon (lucide-react doesn't include it — SVG inline) ───────────────
function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  );
}

// ─── Footer data ──────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Buscar', href: '/buscar' },
  { label: 'Mayoristas', href: '/mayoristas' },
  { label: 'Contacto', href: '/contacto' },
];

const LEGAL_LINKS = [
  { label: 'Política de privacidad', href: '/legal/privacidad' },
  { label: 'Términos y condiciones', href: '/legal/terminos' },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', icon: <InstagramIcon size={18} /> },
  { label: 'Facebook', href: '#', icon: <FacebookIcon size={18} /> },
  { label: 'TikTok', href: '#', icon: <TikTokIcon size={18} /> },
];

// ─── Footer component ─────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer
      className="bg-brand-sand text-brand-text-soft"
      aria-label="Pie de página"
    >
      {/* ── Top divider line ────────────────────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Col 1: Brand ──────────────────────────────── */}
          <div className="space-y-4">
            <p className="font-body text-sm text-brand-text-soft leading-relaxed max-w-xs">
              Accesorios premium en acero y rodio. Elegancia atemporal para quienes aprecian los detalles.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center h-8 w-8 rounded-full border border-brand-line bg-brand-pearl text-brand-text-soft hover:border-brand-gold hover:text-brand-gold-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Col 2: Navegar ────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="font-body text-xs font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
              Navegar
            </h3>
            <ul className="space-y-2.5" role="list">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-body text-sm text-brand-text hover:text-brand-gold-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Legal ──────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="font-body text-xs font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
              Legal
            </h3>
            <ul className="space-y-2.5" role="list">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-body text-sm text-brand-text hover:text-brand-gold-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4: Contacto ───────────────────────────── */}
          <div className="space-y-4">
            <h3 className="font-body text-xs font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
              Contacto
            </h3>
            <ul className="space-y-2.5 font-body text-sm text-brand-text" role="list">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-brand-gold-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm break-all"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
                  className="hover:text-brand-gold-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                >
                  {CONTACT_PHONE}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/*
          ── Closing brand mark ─────────────────────────────
          Its own full-width band rather than a fourth thing inside column 1,
          which is what lets it be this large without fighting the link
          columns for space. Moved out of that column entirely so the wordmark
          appears once, not twice.

          Playfair (font-wordmark), dark text on the light sand footer, per the
          palette. Tracking eases off as the size grows: 0.2em is elegant at
          36px and starts to pull the six letters apart at 72px, so the largest
          step tightens rather than widening the lockup past its own row.
        */}
        <div className="mt-14 flex flex-col items-center border-t border-brand-line pt-12">
          <span
            className="font-wordmark text-4xl font-normal text-brand-text sm:text-5xl lg:text-6xl"
            style={{ letterSpacing: '0.18em' }}
          >
            BRISAL
          </span>
          <span className="mt-3 font-body text-[10px] font-normal tracking-[0.4em] text-brand-gold-deep uppercase sm:text-xs">
            BY SALVADOR
          </span>
          <span
            className="mt-6 h-px w-16 bg-brand-gold/60"
            aria-hidden="true"
          />
        </div>

        {/* ── Bottom bar ──────────────────────────────────── */}
        <div className="mt-10 border-t border-brand-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-brand-text-soft">
            © {COPYRIGHT_YEAR} Brisal by Salvador. Todos los derechos reservados.
          </p>
          <p className="font-body text-xs text-brand-text-soft">
            Diseñado con elegancia
          </p>
        </div>
      </div>
    </footer>
  );
}
