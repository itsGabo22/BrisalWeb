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
const COPYRIGHT_YEAR = 2025;

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
      className="bg-brand-neutral-900 text-brand-neutral-300"
      aria-label="Pie de página"
    >
      {/* ── Top divider line ────────────────────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Col 1: Brand ──────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex flex-col leading-none">
              <span
                className="font-serif text-xl font-bold tracking-widest text-brand-pearl"
                style={{ letterSpacing: '0.2em' }}
              >
                BRISAL
              </span>
              <span className="font-sans text-[9px] font-semibold tracking-[0.35em] text-brand-gold uppercase mt-0.5">
                BY SALVADOR
              </span>
            </div>
            <p className="font-sans text-sm text-brand-neutral-400 leading-relaxed max-w-xs">
              Accesorios premium en acero y rodio. Elegancia atemporal para quienes aprecian los detalles.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center h-8 w-8 rounded-full border border-brand-neutral-700 text-brand-neutral-400 hover:border-brand-gold hover:text-brand-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Col 2: Navegar ────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="font-sans text-xs font-bold tracking-[0.2em] text-brand-gold uppercase">
              Navegar
            </h3>
            <ul className="space-y-2.5" role="list">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-sm text-brand-neutral-400 hover:text-brand-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Legal ──────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="font-sans text-xs font-bold tracking-[0.2em] text-brand-gold uppercase">
              Legal
            </h3>
            <ul className="space-y-2.5" role="list">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-sm text-brand-neutral-400 hover:text-brand-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4: Contacto ───────────────────────────── */}
          <div className="space-y-4">
            <h3 className="font-sans text-xs font-bold tracking-[0.2em] text-brand-gold uppercase">
              Contacto
            </h3>
            <ul className="space-y-2.5 font-sans text-sm text-brand-neutral-400" role="list">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-brand-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm break-all"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
                  className="hover:text-brand-gold-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
                >
                  {CONTACT_PHONE}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────── */}
        <div className="mt-12 border-t border-brand-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-brand-neutral-500">
            © {COPYRIGHT_YEAR} Brisal by Salvador. Todos los derechos reservados.
          </p>
          <p className="font-sans text-xs text-brand-neutral-600">
            Diseñado con elegancia ✦
          </p>
        </div>
      </div>
    </footer>
  );
}
