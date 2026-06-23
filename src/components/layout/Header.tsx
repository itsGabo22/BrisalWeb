'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Heart, User, ShoppingBag } from 'lucide-react';

import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/layout/MobileNav';

// ─── Configurable constants (no business text in JSX) ────────────────────────
const ANNOUNCEMENT_TEXT = 'Envíos gratis en compras superiores a $200.000';

// ─── Navigation data — shape matches Prisma Category model ───────────────────
type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'cat-accesorios',
    name: 'Accesorios',
    slug: 'accesorios',
    children: [
      { id: 'sub-acero', name: 'Acero', slug: 'acero' },
      { id: 'sub-rodio', name: 'Rodio', slug: 'rodio' },
    ],
  },
];

// ─── Mega-menu decision: CLICK-based.
// Reason: hover triggers accidentally on touch-screen laptops and causes
// accessibility issues with keyboard navigation. Click-open + outside-click-close
// is more predictable and aligns with WCAG 2.1 SC 2.1.1 (Keyboard).
// ─────────────────────────────────────────────────────────────────────────────

interface MegaMenuProps {
  category: NavCategory;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function MegaMenu({ category, isOpen, onToggle, onClose }: MegaMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-1 font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 rounded-sm px-1 py-0.5',
          'text-brand-neutral-700 hover:text-brand-gold',
        )}
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

      <motion.div
        initial={false}
        animate={isOpen ? { opacity: 1, y: 0, pointerEvents: 'auto' } : { opacity: 0, y: -8, pointerEvents: 'none' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute left-1/2 top-full mt-3 -translate-x-1/2 w-48 rounded-xl border border-brand-neutral-200/60 bg-brand-pearl/95 backdrop-blur-md shadow-xl p-2"
        role="menu"
        aria-label={`Subcategorías de ${category.name}`}
      >
        {category.children.map((child) => (
          <Link
            key={child.id}
            href={`/catalogo/${category.slug}/${child.slug}`}
            role="menuitem"
            onClick={onClose}
            className="block rounded-lg px-4 py-2.5 font-sans text-sm text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            {child.name}
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  // Close mega-menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  // Placeholder cart count — will be connected to cartStore in Phase 2.4
  const cartItemCount = 0;

  return (
    <>
      {/* ── Announcement Bar ──────────────────────────────── */}
      <div
        className="w-full py-2 px-4 text-center font-sans text-xs font-medium tracking-wide"
        style={{ backgroundColor: '#CCA42D', color: '#1F1E1B' }}
        role="banner"
        aria-label="Anuncio de la tienda"
      >
        {ANNOUNCEMENT_TEXT}
      </div>

      {/* ── Main Header ───────────────────────────────────── */}
      <motion.header
        ref={headerRef}
        animate={
          scrolled
            ? { backgroundColor: 'rgba(250, 248, 245, 0.88)' }
            : { backgroundColor: 'rgba(250, 248, 245, 0)' }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'sticky top-0 z-30 w-full transition-shadow',
          scrolled && 'shadow-sm backdrop-blur-lg border-b border-brand-neutral-200/50',
        )}
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ── Logo ──────────────────────────────────────── */}
          <Link
            href="/"
            className="flex flex-col leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-sm"
            aria-label="Brisal by Salvador — Inicio"
          >
            <span
              className="font-serif text-lg font-bold tracking-widest text-brand-neutral-900"
              style={{ letterSpacing: '0.2em' }}
            >
              BRISAL
            </span>
            <span className="font-sans text-[9px] font-semibold tracking-[0.35em] text-brand-gold uppercase">
              BY SALVADOR
            </span>
          </Link>

          {/* ── Desktop Navigation (center) ───────────────── */}
          <nav
            className="hidden lg:flex items-center gap-6"
            aria-label="Menú principal"
          >
            {NAV_CATEGORIES.map((cat) => (
              <MegaMenu
                key={cat.id}
                category={cat}
                isOpen={openMenuId === cat.id}
                onToggle={() => toggleMenu(cat.id)}
                onClose={() => setOpenMenuId(null)}
              />
            ))}
            <Link
              href="/mayoristas"
              className="font-sans text-sm font-semibold tracking-wide text-brand-gold border border-brand-gold/40 rounded-full px-4 py-1.5 hover:bg-brand-gold hover:text-brand-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              Mayorista
            </Link>
          </nav>

          {/* ── Action Icons (right) ──────────────────────── */}
          <div className="flex items-center gap-1">
            {/* Desktop icons */}
            <div className="hidden lg:flex items-center gap-1">
              <HeaderIconButton href="/buscar" label="Buscar" icon={<Search size={18} />} />
              <HeaderIconButton href="/cuenta/favoritos" label="Lista de deseos" icon={<Heart size={18} />} />
              <HeaderIconButton href="/cuenta" label="Mi cuenta" icon={<User size={18} />} />
            </div>

            {/* Cart — visible on all breakpoints */}
            <Link
              href="/carrito"
              aria-label={`Carrito (${cartItemCount} artículos)`}
              className="relative flex items-center justify-center h-9 w-9 rounded-full text-brand-neutral-700 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              <ShoppingBag size={18} />
              {cartItemCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[9px] font-bold text-brand-neutral-900"
                  aria-hidden="true"
                >
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-full text-brand-neutral-700 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ml-1"
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
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Navigation ─────────────────────────────── */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        categories={NAV_CATEGORIES}
        cartItemCount={cartItemCount}
      />
    </>
  );
}

// ─── Helper: desktop icon button ─────────────────────────────────────────────
function HeaderIconButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex items-center justify-center h-9 w-9 rounded-full text-brand-neutral-700 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
    >
      {icon}
    </Link>
  );
}
