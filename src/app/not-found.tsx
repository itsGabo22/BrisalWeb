import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  // Keeps a 404 out of the index even if something links to it.
  robots: { index: false, follow: true },
};

/**
 * Branded 404.
 *
 * Replaces Next's generic default page (no `not-found.tsx` existed, so an
 * unmatched route rendered the framework's black-and-white "404 | This page
 * could not be found"). It sits inside the root layout, so the header, footer
 * and WhatsApp button are all still there — a visitor who lands here by way of
 * a stale link is one tap from anywhere on the site.
 *
 * `primary`, not `glass`, for the CTA: the glass variant is explicitly for
 * buttons over hero photography and has nothing to frost against flat cream —
 * see the note on the variant itself. `primary` is the site's one CTA style.
 *
 * Kept deliberately plain. This is a wrong turn, not a destination; anything
 * more elaborate would be design that only ever gets seen by mistake.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      {/* Same lockup as the footer's, at a smaller size. Playfair, untouched. */}
      <span
        className="font-wordmark text-4xl font-normal text-brand-text sm:text-5xl"
        style={{ letterSpacing: '0.18em' }}
      >
        BRISAL
      </span>
      <span className="mt-2 font-body text-[10px] font-normal tracking-[0.4em] text-brand-gold-deep uppercase sm:text-xs">
        BY SALVADOR
      </span>

      <div className="mt-8 flex items-center gap-3" aria-hidden="true">
        <span className="h-px w-10 bg-brand-gold" />
        <span className="text-[10px] text-brand-gold">◆</span>
        <span className="h-px w-10 bg-brand-gold" />
      </div>

      {/* The number is decorative next to the sentence that actually explains
          the situation, so it is sized as an accent rather than a headline. */}
      <p className="mt-8 font-body text-sm font-normal tracking-[0.3em] text-brand-gold-deep uppercase">
        Error 404
      </p>
      <h1 className="mt-3 font-heading text-3xl font-medium text-brand-text sm:text-4xl">
        Esta página no existe
      </h1>
      <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-brand-text-soft">
        No pudimos encontrar lo que buscabas. Puede que el enlace haya cambiado o
        que la pieza ya no esté disponible.
      </p>

      <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
        <Button size="lg" asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
        <Link
          href="/catalogo"
          className="rounded-sm font-body text-sm text-brand-gold-deep underline underline-offset-4 transition-colors hover:text-brand-text focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Ver catálogo
        </Link>
      </div>
    </main>
  );
}
