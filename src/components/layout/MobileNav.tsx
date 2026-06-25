'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Heart, User, ShoppingBag, X, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  categories: NavCategory[];
  cartItemCount: number;
}

// ─── Focus trap hook ──────────────────────────────────────────────────────────
// Traps keyboard focus within the drawer when it is open.
function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableEls = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableEls = getFocusableEls();
      if (focusableEls.length === 0) return;

      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Auto-focus first element when drawer opens
    const firstEl = getFocusableEls()[0];
    firstEl?.focus();

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
}

// ─── MobileNav component ──────────────────────────────────────────────────────
export function MobileNav({
  isOpen,
  onClose,
  categories,
  cartItemCount,
}: MobileNavProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  useFocusTrap(drawerRef, isOpen);

  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    setExpandedId(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ──────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* ── Drawer ────────────────────────────────────── */}
          <motion.div
            key="drawer"
            id="mobile-nav"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="bg-brand-pearl fixed inset-y-0 left-0 z-50 flex w-80 max-w-[90vw] flex-col shadow-2xl lg:hidden"
          >
            {/* ── Header strip ──────────────────────────── */}
            <div
              className="border-brand-neutral-200 flex items-center justify-between border-b px-6 py-4"
              style={{ backgroundColor: '#C9A96E' }}
            >
              <div className="flex flex-col leading-none">
                <span className="text-brand-neutral-900 font-serif text-base font-bold tracking-widest">
                  BRISAL
                </span>
                <span className="text-brand-neutral-800 font-sans text-[8px] font-semibold tracking-[0.35em] uppercase">
                  BY SALVADOR
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar menú"
                className="text-brand-neutral-800 hover:bg-brand-neutral-900/10 focus-visible:ring-brand-neutral-900 flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Nav links ─────────────────────────────── */}
            <nav
              className="flex-1 space-y-1 overflow-y-auto px-4 py-6"
              aria-label="Menú móvil"
            >
              {categories.map((cat) => (
                <div key={cat.id}>
                  {cat.children.length === 0 ? (
                    <Link
                      href={`/catalogo/${cat.slug}`}
                      onClick={handleLinkClick}
                      className="text-brand-neutral-800 hover:bg-brand-neutral-100 hover:text-brand-gold focus-visible:ring-brand-gold flex w-full items-center rounded-lg px-4 py-3 font-sans text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {cat.name}
                    </Link>
                  ) : (
                    <button
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === cat.id ? null : cat.id,
                        )
                      }
                      aria-expanded={expandedId === cat.id}
                      className={cn(
                        'focus-visible:ring-brand-gold flex w-full items-center justify-between rounded-lg px-4 py-3 font-sans text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                        expandedId === cat.id
                          ? 'bg-brand-gold/10 text-brand-gold'
                          : 'text-brand-neutral-800 hover:bg-brand-neutral-100 hover:text-brand-gold',
                      )}
                    >
                      {cat.name}
                      <motion.div
                        animate={{ rotate: expandedId === cat.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} aria-hidden="true" />
                      </motion.div>
                    </button>
                  )}

                  <AnimatePresence initial={false}>
                    {cat.children.length > 0 && expandedId === cat.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-brand-gold/30 mt-1 ml-4 space-y-0.5 border-l-2 pl-3">
                          {cat.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/catalogo/${cat.slug}/${child.slug}`}
                              onClick={handleLinkClick}
                              className="text-brand-neutral-600 hover:bg-brand-gold/10 hover:text-brand-gold focus-visible:ring-brand-gold block rounded-md px-3 py-2.5 font-sans text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/mayoristas"
                  onClick={handleLinkClick}
                  className="text-brand-gold border-brand-gold/40 hover:bg-brand-gold hover:text-brand-neutral-900 focus-visible:ring-brand-gold flex w-full items-center rounded-lg border px-4 py-3 font-sans text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  Mayorista
                </Link>
              </div>

              <div className="border-brand-neutral-200 space-y-0.5 border-t pt-4">
                <MobileNavLink
                  href="/buscar"
                  label="Buscar"
                  icon={<Search size={16} />}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/cuenta/favoritos"
                  label="Lista de deseos"
                  icon={<Heart size={16} />}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/cuenta"
                  label="Mi cuenta"
                  icon={<User size={16} />}
                  onClick={handleLinkClick}
                />
                <MobileNavLink
                  href="/carrito"
                  label={`Carrito${cartItemCount > 0 ? ` (${cartItemCount})` : ''}`}
                  icon={<ShoppingBag size={16} />}
                  onClick={handleLinkClick}
                />
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Helper: mobile nav link row ─────────────────────────────────────────────
function MobileNavLink({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-brand-neutral-700 hover:bg-brand-neutral-100 hover:text-brand-gold focus-visible:ring-brand-gold flex items-center gap-3 rounded-lg px-4 py-3 font-sans text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}
