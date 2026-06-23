import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import './globals.css';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      {/*
        Layout decision — MobileNav state lives inside Header via local useState.
        Rationale: the open/close state is purely local to the Header/MobileNav
        pair, has no cross-component consumers, and doesn't need to persist across
        navigations. A Zustand store would add unnecessary complexity at this phase.
        This can be migrated to a uiStore in Phase 2 if other components need to
        read or set the drawer state (e.g., a "quick-add" from a product card).
      */}
      <body className="flex min-h-full flex-col bg-brand-pearl text-foreground overflow-x-hidden">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
