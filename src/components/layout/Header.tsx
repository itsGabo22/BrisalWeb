'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';

import { MobileNav } from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils';
import { categoryNavigationTree } from '@/lib/repositories';
import { useCartStore } from '@/stores/cartStore';

const ANNOUNCEMENT_TEXT = 'Envíos gratis en compras superiores a $200.000';
const WHOLESALE_LABEL = 'Mayorista';

type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

const NAV_CATEGORIES: NavCategory[] = categoryNavigationTree.map(
  (category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    children:
      category.children?.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
      })) ?? [],
  }),
);

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

  const linkClassName = cn(
    'flex items-center gap-1 rounded-sm px-1 py-0.5 font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2',
    'text-brand-neutral-700 hover:text-brand-gold',
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
          className="border-brand-neutral-200/60 bg-brand-pearl/95 absolute top-full left-1/2 mt-3 w-48 -translate-x-1/2 rounded-xl border p-2 shadow-xl backdrop-blur-md"
          role="menu"
          aria-label={`Subcategorías de ${category.name}`}
        >
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/catalogo/${category.slug}/${child.slug}`}
              role="menuitem"
              onClick={onClose}
              className="text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold focus-visible:ring-brand-gold block rounded-lg px-4 py-2.5 font-sans text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {child.name}
            </Link>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}

export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  React.useEffect(() => {
    setMounted(true);
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
      <div
        className="w-full px-4 py-2 text-center font-sans text-xs font-medium tracking-wide"
        style={{ backgroundColor: '#CCA42D', color: '#1F1E1B' }}
        role="banner"
        aria-label="Anuncio de la tienda"
      >
        {ANNOUNCEMENT_TEXT}
      </div>

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
          scrolled &&
            'border-brand-neutral-200/50 border-b shadow-sm backdrop-blur-lg',
        )}
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="focus-visible:ring-brand-gold flex flex-col rounded-sm leading-none focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Brisal by Salvador - Inicio"
          >
            <span
              className="text-brand-neutral-900 font-serif text-lg font-bold tracking-widest"
              style={{ letterSpacing: '0.2em' }}
            >
              BRISAL
            </span>
            <span className="text-brand-gold font-sans text-[9px] font-semibold tracking-[0.35em] uppercase">
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
              className="border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-brand-neutral-900 focus-visible:ring-brand-gold rounded-full border px-4 py-1.5 font-sans text-sm font-semibold tracking-wide transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {WHOLESALE_LABEL}
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-1 lg:flex">
              <HeaderIconButton
                href="/buscar"
                label="Buscar"
                icon={<Search size={18} />}
              />
              <HeaderIconButton
                href="/cuenta/favoritos"
                label="Lista de deseos"
                icon={<Heart size={18} />}
              />
              <HeaderIconButton
                href="/cuenta"
                label="Mi cuenta"
                icon={<User size={18} />}
              />
            </div>

            <Link
              href="/carrito"
              aria-label={`Carrito (${cartItemCount} artículos)`}
              className="text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold focus-visible:ring-brand-gold relative flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <ShoppingBag size={18} />
              {cartItemCount > 0 && (
                <span
                  className="bg-brand-gold text-brand-neutral-900 absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                  aria-hidden="true"
                >
                  {cartItemCount}
                </span>
              )}
            </Link>

            <button
              className="text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold focus-visible:ring-brand-gold ml-1 flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
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

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        categories={NAV_CATEGORIES}
        cartItemCount={cartItemCount}
      />
    </>
  );
}

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
      className="text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold focus-visible:ring-brand-gold flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {icon}
    </Link>
  );
}
