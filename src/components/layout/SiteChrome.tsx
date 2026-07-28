'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import type { Category } from '@/types';

// Routes in the (auth) group — bare pages, no site chrome (see src/app/(auth)/layout.tsx).
const AUTH_ROUTES = ['/login', '/registro', '/registro-mayorista', '/mayoristas/pendiente'];

export function SiteChrome({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: Category[];
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
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
