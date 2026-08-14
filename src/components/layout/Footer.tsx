import * as React from 'react';
import Link from 'next/link';

import {
  CONTACT_ADDRESS_LINES,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  SOCIAL_PROFILES,
} from '@/lib/constants/contact';
// lucide-react v1.x exports neither Instagram nor TikTok — inline SVGs below.
function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// The Facebook icon that used to live here was deleted along with its link:
// the business does not use Facebook, and the footer was shipping an
// href="#" placeholder for it.

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

// Icons are paired to the shared profile list by label, so adding or removing
// a network is a one-line change in `@/lib/constants/contact` and this file
// only has to know how to draw it.
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Instagram: <InstagramIcon size={18} />,
  TikTok: <TikTokIcon size={18} />,
};

// ─── Footer component ─────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer
      className="bg-brand-sand text-brand-text-soft"
      aria-label="Pie de página"
    >
      {/* ── Top divider line ────────────────────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent" />

      {/*
        Layout: brand block on top, everything else compact beneath it.

        The wordmark moved from a band near the BOTTOM to the top, above the
        tagline it belongs to — previously the tagline sat in a column with no
        mark over it while the mark sat alone 400px lower, so the two halves of
        the same lockup never read as one thing. There is exactly ONE wordmark
        in the footer now.

        Centred rather than left-aligned: the three link columns below are
        evenly distributed, so a left-flushed mark would hang off-axis from
        everything under it. Centred also lets the tagline sit directly beneath
        the mark at a readable measure instead of being squeezed into a quarter
        column.

        Vertical rhythm is deliberately tight — this footer was taller than the
        viewport on a phone. Padding and gaps are roughly halved throughout.
      */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* ── Tier 1: brand block ─────────────────────────── */}
        <div className="flex flex-col items-center text-center">
          <span
            className="font-wordmark text-4xl font-normal text-brand-text sm:text-5xl"
            style={{ letterSpacing: '0.18em' }}
          >
            BRISAL
          </span>
          <span className="mt-2 font-body text-[10px] font-normal tracking-[0.4em] text-brand-gold-deep uppercase sm:text-xs">
            BY SALVADOR
          </span>

          <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-brand-text-soft">
            Accesorios premium en acero y rodio. Elegancia atemporal para quienes
            aprecian los detalles.
          </p>
        </div>

        {/*
          ── Tier 2: links + socials, one row ─────────────
          Two columns on a phone rather than three stacked blocks: stacking was
          most of the 954px this footer used to occupy there. Contacto spans the
          full width on its own row because the email address is long enough to
          break badly in a third of a 390px screen.

          The socials are the fourth cell of this row rather than a block of
          their own under the tagline — that removed a whole tier from the
          desktop footer without losing anything.
        */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-brand-line pt-7 sm:grid-cols-4">
          <div className="space-y-3">
            <h3 className="font-body text-xs font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
              Navegar
            </h3>
            <ul className="space-y-2" role="list">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="rounded-sm font-body text-sm text-brand-text transition-colors hover:text-brand-gold-deep focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-body text-xs font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
              Legal
            </h3>
            <ul className="space-y-2" role="list">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="rounded-sm font-body text-sm text-brand-text transition-colors hover:text-brand-gold-deep focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 space-y-3 sm:col-span-1">
            <h3 className="font-body text-xs font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
              Contacto
            </h3>
            <ul className="space-y-2 font-body text-sm text-brand-text" role="list">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="rounded-sm break-all transition-colors hover:text-brand-gold-deep focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`tel:+${CONTACT_PHONE_E164}`}
                  className="rounded-sm transition-colors hover:text-brand-gold-deep focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                >
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
              {/* The physical store. Plain text, not a Maps link: no address
                  anywhere else on the site links out, so there is no pattern
                  to be consistent with — see the report. `<address>` because
                  that is what the element is for, with the browser default
                  italic turned off. */}
              <li>
                <address className="text-brand-text-soft not-italic">
                  {CONTACT_ADDRESS_LINES.map((line) => (
                    <React.Fragment key={line}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </address>
              </li>
            </ul>
          </div>

          {/* The icons that were under the tagline, relocated here. "Síguenos"
              is a label for them, not new content — the columns beside it all
              carry one, and a bare icon row in a grid of titled columns reads
              as an orphan. */}
          <div className="col-span-2 space-y-3 sm:col-span-1">
            <h3 className="font-body text-xs font-medium tracking-[0.2em] text-brand-gold-deep uppercase">
              Síguenos
            </h3>
            <div className="flex items-center gap-3">
              {SOCIAL_PROFILES.map(({ label, handle, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  // The handle is in the label so a screen reader announces
                  // WHICH account, not just "Instagram".
                  aria-label={`${label}: ${handle}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-line bg-brand-pearl text-brand-text-soft transition-colors hover:border-brand-gold hover:text-brand-gold-deep focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                >
                  {SOCIAL_ICONS[label]}
                </a>
              ))}
            </div>
            <p className="font-body text-xs text-brand-text-soft">
              {SOCIAL_PROFILES.map((profile) => profile.handle).join(' · ')}
            </p>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────── */}
        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-brand-line pt-5 sm:flex-row">
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
