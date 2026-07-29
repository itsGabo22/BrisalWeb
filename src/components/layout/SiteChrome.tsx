'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import type { Category } from '@/types';

// Routes in the (auth) group — bare pages, no site chrome (see src/app/(auth)/layout.tsx).
const AUTH_ROUTES = ['/login', '/registro', '/registro-mayorista', '/mayoristas/pendiente'];

// Scroll-to-top button is an allowlist, not a blocklist: it must ONLY appear on
// the homepage, catalog, product detail, and search pages — not on other public
// routes that share the (marketing) group (e.g. /contacto, /mayoristas), so a
// route-group layout mount can't express this. Gated here instead.
function isScrollToTopRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/catalogo') ||
    pathname.startsWith('/producto') ||
    pathname === '/buscar'
  );
}

export function SiteChrome({
  children,
  categories,
  announcementText,
  announcementActive,
}: {
  children: React.ReactNode;
  categories: Category[];
  announcementText: string;
  announcementActive: boolean;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isAdminRoute || isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header
        categories={categories}
        announcementText={announcementText}
        announcementActive={announcementActive}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      {isScrollToTopRoute(pathname) && <ScrollToTopButton />}
    </>
  );
}
