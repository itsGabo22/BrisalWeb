'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ShoppingBag, X, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { WholesaleNavLink } from '@/components/layout/WholesaleNavIndicator';
import { NAV_SECTIONS, WHOLESALE_SECTION } from '@/lib/navigation';
import type { Category } from '@/types';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  /** Root categories with `children` populated — from categoryRepository.getTree(). */
  categories: Category[];
  cartItemCount: number;
  onSearchClick: () => void;
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
  onSearchClick,
}: MobileNavProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  // Which root category's subcategory list is open inside the Categorías block.
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  // The Categorías block itself starts collapsed so the four intent links stay
  // the first thing in the drawer — categories are the secondary path now.
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);

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
    setCategoriesOpen(false);
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
            className="fixed inset-0 z-40 bg-brand-text/35 backdrop-blur-sm lg:hidden"
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
            {/* Was a solid gold band. Now cream, so the drawer reads as one
                continuous light surface from top to bottom, with a gold
                hairline as the only gold left in the header. */}
            <div className="border-brand-line bg-brand-cream flex items-center justify-between border-b px-6 py-4">
              <div className="flex flex-col leading-none">
                <span className="text-brand-text font-wordmark text-base font-normal tracking-widest">
                  BRISAL
                </span>
                <span className="text-brand-gold-deep font-body text-[8px] font-normal tracking-[0.35em] uppercase">
                  BY SALVADOR
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar menú"
                className="text-brand-text hover:bg-brand-gold/10 hover:text-brand-gold-deep focus-visible:ring-brand-gold flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Nav links ─────────────────────────────── */}
            <nav
              className="flex-1 space-y-1 overflow-y-auto px-4 py-6"
              aria-label="Menú móvil"
            >
              {/* ── Intent sections — mirrors the desktop nav ─────── */}
              {NAV_SECTIONS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={handleLinkClick}
                  className="text-brand-text hover:bg-brand-cream hover:text-brand-gold-deep focus-visible:ring-brand-gold flex w-full items-center rounded-lg px-4 py-3 font-body text-sm font-light tracking-[0.1em] transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {label}
                </Link>
              ))}

              {/* ── Categorías ────────────────────────────────────
                  Categories left the top nav, but mobile still needs a direct
                  route into them — the homepage showcase is not reachable from
                  a deep page. Collapsed by default so the intent links stay
                  primary; the tree itself comes from categoryRepository via
                  the root layout, never a hardcoded list. */}
              {categories.length > 0 && (
                <div className="border-brand-line mt-2 border-t pt-2">
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((prev) => !prev)}
                    aria-expanded={categoriesOpen}
                    className={cn(
                      'focus-visible:ring-brand-gold flex w-full items-center justify-between rounded-lg px-4 py-3 font-body text-sm tracking-[0.1em] transition-colors focus-visible:ring-2 focus-visible:outline-none',
                      categoriesOpen
                        ? 'text-brand-gold-deep'
                        : 'text-brand-text hover:bg-brand-cream hover:text-brand-gold-deep',
                    )}
                  >
                    Categorías
                    <motion.div
                      animate={{ rotate: categoriesOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} aria-hidden="true" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {categoriesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-0.5 pt-1">
                          {categories.map((cat) => {
                            const children = cat.children ?? [];
                            return (
                              <div key={cat.id}>
                                <div className="flex items-center">
                                  {/* The name always navigates; the chevron is a
                                      separate control, so a parent category is
                                      never unreachable behind its own toggle. */}
                                  <Link
                                    href={`/catalogo/${cat.slug}`}
                                    onClick={handleLinkClick}
                                    className="text-brand-text-soft hover:text-brand-gold-deep focus-visible:ring-brand-gold flex-1 rounded-md px-4 py-2.5 font-body text-sm font-light tracking-[0.06em] transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                  >
                                    {cat.name}
                                  </Link>
                                  {children.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedId((prev) =>
                                          prev === cat.id ? null : cat.id,
                                        )
                                      }
                                      aria-expanded={expandedId === cat.id}
                                      aria-label={`Ver subcategorías de ${cat.name}`}
                                      className="text-brand-text-soft hover:text-brand-gold-deep focus-visible:ring-brand-gold mr-2 flex size-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                      <motion.div
                                        animate={{
                                          rotate: expandedId === cat.id ? 180 : 0,
                                        }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <ChevronDown size={14} aria-hidden="true" />
                                      </motion.div>
                                    </button>
                                  )}
                                </div>

                                <AnimatePresence initial={false}>
                                  {children.length > 0 && expandedId === cat.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.22, ease: 'easeOut' }}
                                      className="overflow-hidden"
                                    >
                                      <div className="border-brand-gold/30 mt-1 ml-6 space-y-0.5 border-l pl-3">
                                        {children.map((child) => (
                                          <Link
                                            key={child.id}
                                            href={`/catalogo/${cat.slug}/${child.slug}`}
                                            onClick={handleLinkClick}
                                            className="text-brand-text-soft hover:bg-brand-gold/10 hover:text-brand-gold-deep focus-visible:ring-brand-gold block rounded-md px-3 py-2 font-body text-[13px] font-light tracking-[0.06em] transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                          >
                                            {child.name}
                                          </Link>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href={WHOLESALE_SECTION.href}
                  onClick={handleLinkClick}
                  className="text-brand-gold-deep border-brand-gold/50 hover:bg-brand-gold/12 hover:border-brand-gold hover:text-brand-gold-deep focus-visible:ring-brand-gold flex w-full items-center rounded-lg border px-4 py-3 font-body text-sm font-normal tracking-[0.12em] transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {WHOLESALE_SECTION.label}
                </Link>
              </div>

              <div className="border-brand-line space-y-0.5 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSearchClick();
                  }}
                  className="text-brand-text hover:bg-brand-cream hover:text-brand-gold-deep focus-visible:ring-brand-gold flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-body text-sm font-light tracking-[0.06em] transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span aria-hidden="true">
                    <Search size={16} />
                  </span>
                  Buscar
                </button>
                <WholesaleNavLink onClick={handleLinkClick} />
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
      className="text-brand-text hover:bg-brand-cream hover:text-brand-gold-deep focus-visible:ring-brand-gold flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm font-light tracking-[0.06em] transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );
}
