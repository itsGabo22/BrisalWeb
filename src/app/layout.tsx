import type { Metadata, Viewport } from 'next';
import { Jost, Playfair_Display } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import './globals.css';

import { SiteChrome } from '@/components/layout/SiteChrome';
import { PageScrollProvider } from '@/hooks/usePageScroll';
import { getCategoryNavigationTree } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';

/**
 * Body / nav / banner typeface — Jost, replacing Poppins.
 *
 * Jost is a geometric sans in the Futura lineage: narrower apertures and a
 * markedly lighter stroke than Poppins at the same nominal weight, which is
 * the "thinner, more refined" read the client asked for and what
 * cornalinaaccesorios.com uses.
 *
 * Loaded as the VARIABLE font (no `weight` array) rather than as three static
 * cuts. It is one file either way, 300/400/500 all resolve exactly as the
 * brief specifies, and the admin panel's existing 600/700 headings keep
 * rendering at their real weight instead of being clamped to the nearest
 * loaded cut. globals.css maps this to --font-body (and the --font-sans alias);
 * `html` applies font-light, so 300 is the site-wide default.
 */
const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  display: 'swap',
});

// Section headings AND the hero "BRISAL" wordmark. Left on Playfair Display
// on purpose — the wordmark treatment is signed off and must not move.
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
  /**
   * The ITALIC face is loaded explicitly. `next/font` defaults to
   * `['normal']`, so the wholesale band's italic emphasis was being rendered
   * as a browser-synthesized oblique — a mechanically slanted roman. Playfair
   * Display's real italic is a different design (single-storey `a`,
   * calligraphic `e` and `g`), which is the whole reason to set that line in a
   * serif at all.
   *
   * Weight is left unrestricted so the variable range (400-900) stays
   * available; the BRISAL wordmark keeps using 400 and is unaffected.
   */
  style: ['normal', 'italic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Nav categories, admin auth, and wholesale session all read live DB/auth state
// on every request — nothing under this layout can be statically prerendered.
export const dynamic = 'force-dynamic';

// viewport-fit=cover is required for env(safe-area-inset-*) to resolve to
// real values on notched/Dynamic-Island iPhones instead of 0.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'Brisal by Salvador — Accesorios Premium',
    template: '%s | Brisal by Salvador',
  },
  description:
    'Catálogo virtual de accesorios premium en acero y rodio. Elegancia, calidad y estilo para mayoristas y clientes.',
  keywords: [
    'accesorios',
    'joyería',
    'acero',
    'rodio',
    'premium',
    'mayorista',
    'Brisal',
    'Salvador',
  ],
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, siteConfig] = await Promise.all([
    getCategoryNavigationTree(),
    prisma.siteConfig.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    }),
  ]);

  return (
    <html
      lang="es"
      className={`${jost.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased overflow-x-clip`}
    >
      {/*
        Layout decision — MobileNav state lives inside Header via local useState.
        Rationale: the open/close state is purely local to the Header/MobileNav
        pair, has no cross-component consumers, and doesn't need to persist across
        navigations. A Zustand store would add unnecessary complexity at this phase.
        This can be migrated to a uiStore in Phase 2 if other components need to
        read or set the drawer state (e.g., a "quick-add" from a product card).
      */}
      <body className="flex min-h-full flex-col bg-brand-cream text-brand-text overflow-x-clip">
        <PageScrollProvider>
          <SiteChrome
            categories={categories}
            announcementText={siteConfig.announcementText}
            announcementActive={siteConfig.announcementActive}
          >
            {children}
          </SiteChrome>
        </PageScrollProvider>
      </body>
    </html>
  );
}
