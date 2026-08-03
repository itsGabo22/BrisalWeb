import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import './globals.css';

import { SiteChrome } from '@/components/layout/SiteChrome';
import { PageScrollProvider } from '@/hooks/usePageScroll';
import { getCategoryNavigationTree } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
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
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased overflow-x-clip`}
    >
      {/*
        Layout decision — MobileNav state lives inside Header via local useState.
        Rationale: the open/close state is purely local to the Header/MobileNav
        pair, has no cross-component consumers, and doesn't need to persist across
        navigations. A Zustand store would add unnecessary complexity at this phase.
        This can be migrated to a uiStore in Phase 2 if other components need to
        read or set the drawer state (e.g., a "quick-add" from a product card).
      */}
      <body className="flex min-h-full flex-col bg-brand-pearl text-foreground overflow-x-clip">
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
