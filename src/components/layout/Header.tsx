'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, useMotionValueEvent } from 'framer-motion';
import { Search, ShoppingBag } from 'lucide-react';

import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { WholesaleNavIndicator } from '@/components/layout/WholesaleNavIndicator';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS, WHOLESALE_SECTION } from '@/lib/navigation';
import type { Category } from '@/types';
import { usePageScroll } from '@/hooks/usePageScroll';
import { useCartStore } from '@/stores/cartStore';

/**
 * Marks a nav section active. Sections differ only by query string
 * (/catalogo?sort=nuevo vs /catalogo?filter=descuento), so pathname alone
 * can't tell them apart — the single param each link carries is compared too.
 * "Inicio" is exact-match so it doesn't light up on every catalog page.
 */
function useIsSectionActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return React.useCallback(
    (href: string) => {
      const [hrefPath, hrefQuery] = href.split('?');
      if (pathname !== hrefPath) return false;
      if (!hrefQuery) return searchParams.toString() === '';

      const [key, value] = hrefQuery.split('=');
      return searchParams.get(key) === value;
    },
    [pathname, searchParams],
  );
}

interface HeaderProps {
  categories: Category[];
  announcementText: string;
  announcementActive: boolean;
}

export function Header({ categories, announcementText, announcementActive }: HeaderProps) {
  const isSectionActive = useIsSectionActive();
  const { scrollY } = usePageScroll();
  // Lazily read the CURRENT scroll position instead of hardcoding `false`.
  // Header remounts fresh every time SiteChrome swaps between a chrome-less
  // auth route (e.g. /login) and a route with chrome — on back-navigation to
  // an already-scrolled page, scrollY is restored instantly, but a fresh
  // `useState(false)` would render the header transparent for ~300ms until
  // the next scroll `change` event corrected it, producing a visible
  // flash/seam of page content behind the sticky header.
  const [scrolled, setScrolled] = React.useState(() => scrollY.get() > 20);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  React.useEffect(() => {
    const unsubscribe = useCartStore.persist.onFinishHydration(() => {
      setMounted(true);
    });

    void useCartStore.persist.rehydrate();

    return unsubscribe;
  }, []);

  const rawCartItemCount = useCartStore((state) => state.getItemCount());
  const cartItemCount = mounted ? rawCartItemCount : 0;

  return (
    <>
      <AnnouncementBar text={announcementText} active={announcementActive} />

      <motion.header
        ref={headerRef}
        animate={
          scrolled
            ? { backgroundColor: 'rgba(250, 247, 242, 0.9)' }
            : { backgroundColor: 'rgba(250, 247, 242, 0)' }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'sticky top-0 z-30 w-full transition-shadow',
          scrolled && 'border-brand-line border-b shadow-sm backdrop-blur-lg',
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        aria-label="Navegación principal"
      >
        {/* Taller from md up so the enlarged wordmark has room to breathe
            instead of pressing against the announcement bar and the nav.
            Height is a fixed step, not a min-height, so the sticky offset
            stays constant and nothing shifts as the header goes translucent. */}
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20 lg:px-8">
          {/* Mobile: hamburger left */}
          <button
            className="text-brand-text hover:bg-brand-gold/10 hover:text-brand-gold-deep focus-visible:ring-brand-gold flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
          >
            <span className="sr-only">Menú</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/*
            The wordmark, at two sizes. Stays Playfair Display (font-wordmark)
            per AGENTS.md — only the scale changes.

            Desktop steps up hard (18px → 30px) so it anchors the top-left as a
            real brand mark; the "BY SALVADOR" line and its tracking grow with
            it so the lockup keeps its proportions rather than looking like a
            big word with a tiny label stuck under it. The md step (24px) is
            deliberately smaller than the lg one: between md and lg the nav is
            hidden, but at lg it appears, and 30px is the largest that still
            leaves the nav its full gap on a 1024px viewport.
          */}
          <Link
            href="/"
            className="focus-visible:ring-brand-gold hidden flex-col rounded-sm leading-none focus-visible:ring-2 focus-visible:outline-none md:flex"
            aria-label="Brisal by Salvador - Inicio"
          >
            <span
              className="text-brand-text font-wordmark text-2xl font-normal lg:text-3xl"
              style={{ letterSpacing: '0.2em' }}
            >
              BRISAL
            </span>
            <span className="text-brand-gold-deep mt-1 font-body text-[10px] font-normal tracking-[0.3em] uppercase lg:text-[11px]">
              BY SALVADOR
            </span>
          </Link>

          {/* Mobile: centred, and only moderately larger (18px → 20px) — the
              hamburger and the cart/search icons flank it on a 375px line, so
              this is the ceiling before the lockup crowds them. */}
          <Link
            href="/"
            className="focus-visible:ring-brand-gold absolute left-1/2 flex -translate-x-1/2 flex-col rounded-sm leading-none focus-visible:ring-2 focus-visible:outline-none md:hidden"
            aria-label="Brisal by Salvador - Inicio"
          >
            <span
              className="text-brand-text font-wordmark text-xl font-normal"
              style={{ letterSpacing: '0.2em' }}
            >
              BRISAL
            </span>
            <span className="text-brand-gold-deep mt-0.5 font-body text-[9px] font-normal tracking-[0.3em] uppercase">
              BY SALVADOR
            </span>
          </Link>

          {/* Metrics taken from cornalinaaccesorios.com's computed styles:
              weight 400, letter-spacing NORMAL, sentence case. The tracking is
              the important part — the earlier 0.16em is what made this nav read
              cramped and stretched, not the type size. Theirs measures 14px;
              15px here sits in the range the client asked for and reads all but
              identically beside the logo. Held at 400 rather than dropped to
              300 with the body: nav links are small tap targets that have to
              stay crisp, and Jost 400 is already lighter than the Poppins 400
              this replaces. */}
          <nav
            className="hidden items-center gap-7 lg:flex xl:gap-9"
            aria-label="Menú principal"
          >
            {NAV_SECTIONS.map(({ label, href }) => {
              const active = isSectionActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'focus-visible:ring-brand-gold relative rounded-sm py-1 font-body text-[15px] font-normal whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    'after:bg-brand-gold after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:transition-transform after:duration-300 after:content-[""]',
                    active
                      ? 'text-brand-gold-deep after:scale-x-100'
                      : 'text-brand-text hover:text-brand-gold-deep after:scale-x-0 hover:after:scale-x-100',
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href={WHOLESALE_SECTION.href}
              className="border-brand-gold/50 text-brand-gold-deep hover:bg-brand-gold/12 hover:border-brand-gold hover:text-brand-gold-deep focus-visible:ring-brand-gold rounded-full border px-4 py-1.5 font-body text-sm font-normal whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {WHOLESALE_SECTION.label}
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <HeaderIconButton
              onClick={() => setSearchOpen(true)}
              label="Buscar"
              icon={<Search size={18} />}
              className="md:hidden"
            />
            <div className="hidden items-center gap-1 lg:flex">
              <HeaderIconButton
                onClick={() => setSearchOpen(true)}
                label="Buscar"
                icon={<Search size={18} />}
              />
              <WholesaleNavIndicator />
            </div>

            <Link
              href="/carrito"
              aria-label={`Carrito (${cartItemCount} artículos)`}
              className="text-brand-text hover:bg-brand-gold/10 hover:text-brand-gold-deep focus-visible:ring-brand-gold active:scale-95 relative flex h-11 w-11 items-center justify-center rounded-full transition-colors transition-transform duration-200 focus-visible:ring-2 focus-visible:outline-none"
            >
              <ShoppingBag size={18} />
              {cartItemCount > 0 && (
                <motion.span
                  key={cartItemCount}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.3 }}
                  className="bg-brand-gold text-brand-text absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-medium"
                  aria-hidden="true"
                >
                  {cartItemCount}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </motion.header>

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        categories={categories}
        cartItemCount={cartItemCount}
        onSearchClick={() => setSearchOpen(true)}
      />

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function HeaderIconButton({
  href,
  onClick,
  label,
  icon,
  className,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  const sharedClassName = cn(
    'text-brand-text hover:bg-brand-gold/10 hover:text-brand-gold-deep focus-visible:ring-brand-gold flex h-11 w-11 items-center justify-center rounded-full transition-colors transition-transform duration-200 hover:scale-110 focus-visible:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:outline-none',
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={label} className={sharedClassName}>
        {icon}
      </button>
    );
  }

  return (
    <Link href={href ?? '#'} aria-label={label} className={sharedClassName}>
      {icon}
    </Link>
  );
}
