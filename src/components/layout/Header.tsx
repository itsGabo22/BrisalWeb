'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useMotionValueEvent } from 'framer-motion';
import { Search, ShoppingBag } from 'lucide-react';

import { MobileNav } from '@/components/layout/MobileNav';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { WholesaleNavIndicator } from '@/components/layout/WholesaleNavIndicator';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { usePageScroll } from '@/hooks/usePageScroll';
import { useCartStore } from '@/stores/cartStore';

const WHOLESALE_LABEL = 'Mayorista';

type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

function toNavCategories(categories: Category[]): NavCategory[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    children:
      category.children?.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
      })) ?? [],
  }));
}

interface MegaMenuProps {
  category: NavCategory;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function MegaMenu({ category, isOpen, onToggle, onClose }: MegaMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const hasChildren = category.children.length > 0;

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Light weight + wide tracking is what gives the nav its airy, Cornalina-ish
  // read. The type size drops to 12px to pay for that tracking: this nav
  // carries eight Spanish category names plus the Mayorista pill, and at the
  // previous 14px the tracked-out labels ran into the BRISAL logo at 1440px.
  const linkClassName = cn(
    'flex items-center gap-1.5 rounded-sm px-1 py-0.5 font-body text-xs font-light tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2',
    'text-brand-text hover:text-brand-gold-deep',
  );

  return (
    <div ref={menuRef} className="relative">
      {hasChildren ? (
        <button
          onClick={onToggle}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={linkClassName}
        >
          {category.name}
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </button>
      ) : (
        <Link href={`/catalogo/${category.slug}`} className={linkClassName}>
          {category.name}
        </Link>
      )}

      {hasChildren ? (
        <motion.div
          initial={false}
          animate={
            isOpen
              ? { opacity: 1, y: 0, pointerEvents: 'auto' }
              : { opacity: 0, y: -8, pointerEvents: 'none' }
          }
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="border-brand-line bg-brand-pearl/95 absolute top-full left-1/2 mt-3 w-48 -translate-x-1/2 rounded-xl border p-2 shadow-xl backdrop-blur-md"
          role="menu"
          aria-label={`Subcategorías de ${category.name}`}
        >
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/catalogo/${category.slug}/${child.slug}`}
              role="menuitem"
              onClick={onClose}
              className="text-brand-text-soft hover:bg-brand-gold/10 hover:text-brand-gold-deep focus-visible:ring-brand-gold block rounded-lg px-4 py-2.5 font-body text-[13px] font-light tracking-[0.08em] transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {child.name}
            </Link>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}

interface HeaderProps {
  categories: Category[];
  announcementText: string;
  announcementActive: boolean;
}

export function Header({ categories, announcementText, announcementActive }: HeaderProps) {
  const NAV_CATEGORIES = React.useMemo(
    () => toNavCategories(categories),
    [categories],
  );
  const { scrollY } = usePageScroll();
  // Lazily read the CURRENT scroll position instead of hardcoding `false`.
  // Header remounts fresh every time SiteChrome swaps between a chrome-less
  // auth route (e.g. /login) and a route with chrome — on back-navigation to
  // an already-scrolled page, scrollY is restored instantly, but a fresh
  // `useState(false)` would render the header transparent for ~300ms until
  // the next scroll `change` event corrected it, producing a visible
  // flash/seam of page content behind the sticky header.
  const [scrolled, setScrolled] = React.useState(() => scrollY.get() > 20);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
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

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const rawCartItemCount = useCartStore((state) => state.getItemCount());
  const cartItemCount = mounted ? rawCartItemCount : 0;

  return (
    <>
      {announcementActive && announcementText && (
        <div
          className="w-full px-4 py-2 text-center font-body text-[11px] font-light uppercase tracking-[0.2em]"
          style={{ backgroundColor: '#C9A96E', color: '#2A2521' }}
          role="banner"
          aria-label="Anuncio de la tienda"
        >
          {announcementText}
        </div>
      )}

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
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

          {/* Desktop: logo left */}
          <Link
            href="/"
            className="focus-visible:ring-brand-gold hidden flex-col rounded-sm leading-none focus-visible:ring-2 focus-visible:outline-none md:flex"
            aria-label="Brisal by Salvador - Inicio"
          >
            <span
              className="text-brand-text font-heading text-lg font-normal tracking-widest"
              style={{ letterSpacing: '0.2em' }}
            >
              BRISAL
            </span>
            <span className="text-brand-gold-deep font-body text-[9px] font-normal tracking-[0.35em] uppercase">
              BY SALVADOR
            </span>
          </Link>

          {/* Mobile: logo centered */}
          <Link
            href="/"
            className="focus-visible:ring-brand-gold absolute left-1/2 flex -translate-x-1/2 flex-col rounded-sm leading-none focus-visible:ring-2 focus-visible:outline-none md:hidden"
            aria-label="Brisal by Salvador - Inicio"
          >
            <span
              className="text-brand-text font-heading text-lg font-normal tracking-widest"
              style={{ letterSpacing: '0.2em' }}
            >
              BRISAL
            </span>
            <span className="text-brand-gold-deep font-body text-[9px] font-normal tracking-[0.35em] uppercase">
              BY SALVADOR
            </span>
          </Link>

          <nav
            className="hidden items-center gap-4 lg:flex"
            aria-label="Menú principal"
          >
            {NAV_CATEGORIES.map((category) => (
              <MegaMenu
                key={category.id}
                category={category}
                isOpen={openMenuId === category.id}
                onToggle={() => toggleMenu(category.id)}
                onClose={() => setOpenMenuId(null)}
              />
            ))}
            <Link
              href="/mayoristas"
              className="border-brand-gold/50 text-brand-gold-deep hover:bg-brand-gold hover:text-brand-text focus-visible:ring-brand-gold rounded-full border px-3.5 py-1.5 font-body text-[11px] font-normal tracking-[0.12em] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {WHOLESALE_LABEL}
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
        categories={NAV_CATEGORIES}
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
