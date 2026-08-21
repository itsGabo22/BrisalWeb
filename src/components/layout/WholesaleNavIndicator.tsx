'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, User, UserCheck, UserX, LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useWholesaleSession } from '@/hooks/useWholesaleSession';
import { createClient } from '@/lib/supabase/client';

const CONFIG = {
  loading: { href: '/login', label: 'Ingresar', icon: User },
  guest: { href: '/login', label: 'Ingresar', icon: User },
  pending: {
    href: '/mayoristas/pendiente',
    label: 'Solicitud pendiente',
    icon: Clock,
  },
  approved: { href: '/catalogo', label: 'Cuenta mayorista', icon: UserCheck },
  /**
   * Points at the same page as `pending`, which now tells the two apart and
   * shows revocation copy. Deliberately NOT the approved branch: a revoked
   * account gets no account dropdown, because there is no wholesale account
   * behind it any more.
   */
  revoked: {
    href: '/mayoristas/pendiente',
    label: 'Acceso mayorista revocado',
    icon: UserX,
  },
} as const;

/** Signs the wholesaler out and sends them to the login page — matches the
 * pattern already used in /mayoristas/pendiente for the same customer flow. */
async function logoutWholesaler(router: ReturnType<typeof useRouter>) {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push('/login');
  router.refresh();
}

/** Header icon: routes to login, pending review, or the wholesale account
 * depending on session state. Approved wholesalers get a dropdown with a
 * logout option instead of a plain link. Used both at desktop (top-right,
 * `menuAlign="right"`, the default) and in the mobile header bar
 * (top-left, next to the hamburger, `menuAlign="left"`). */
export function WholesaleNavIndicator({
  /** True while the header sits transparent over the homepage hero. */
  overHero = false,
  /**
   * Which edge of the trigger the dropdown hangs from. A top-right trigger
   * needs the menu to open leftward (`right-0`, the default); a top-left
   * trigger -- the mobile header placement -- needs it to open rightward
   * (`left-0`), or a `w-48` menu anchored `right-0` on a button sitting near
   * x=0 would render mostly off the left edge of the viewport.
   */
  menuAlign = 'right',
}: {
  overHero?: boolean;
  menuAlign?: 'left' | 'right';
} = {}) {
  const status = useWholesaleSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { href, label, icon: Icon } = CONFIG[status];

  React.useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (status !== 'approved') {
    return (
      <Link
        href={href}
        aria-label={label}
        className={cn(
          'hover:bg-brand-gold/10 focus-visible:ring-brand-gold flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 focus-visible:ring-2 focus-visible:outline-none',
          overHero
            ? 'text-white site-header__ink-over-hero hover:text-brand-gold-light'
            : 'text-brand-neutral-700 hover:text-brand-gold',
        )}
      >
        <Icon size={18} />
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        className={cn(
          'hover:bg-brand-gold/10 flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none',
          overHero
            ? 'text-brand-gold-light site-header__ink-over-hero'
            : 'text-brand-gold',
        )}
      >
        <Icon size={18} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label="Cuenta mayorista"
          className={cn(
            'border-brand-neutral-200/60 bg-brand-pearl/95 absolute top-full z-10 mt-3 w-48 rounded-xl border p-2 shadow-xl backdrop-blur-md',
            menuAlign === 'left' ? 'left-0' : 'right-0',
          )}
        >
          <Link
            href="/catalogo"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold block rounded-lg px-4 py-2.5 font-body text-sm transition-colors"
          >
            Cuenta mayorista
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              void logoutWholesaler(router);
            }}
            className="text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-left font-body text-sm transition-colors"
          >
            <LogOut size={14} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

/** Mobile nav row variant — matches MobileNavLink markup. Approved
 * wholesalers get an extra "Cerrar sesión" row below the account link. */
export function WholesaleNavLink({ onClick }: { onClick: () => void }) {
  const status = useWholesaleSession();
  const router = useRouter();
  const { href, label, icon: Icon } = CONFIG[status];

  return (
    <>
      <Link
        href={href}
        onClick={onClick}
        className="text-brand-neutral-700 hover:bg-brand-neutral-100 hover:text-brand-gold focus-visible:ring-brand-gold flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span aria-hidden="true">
          <Icon size={16} />
        </span>
        {label}
      </Link>

      {status === 'approved' && (
        <button
          type="button"
          onClick={() => {
            onClick();
            void logoutWholesaler(router);
          }}
          className="text-brand-neutral-700 hover:bg-brand-neutral-100 hover:text-brand-gold focus-visible:ring-brand-gold flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-body text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span aria-hidden="true">
            <LogOut size={16} />
          </span>
          Cerrar sesión
        </button>
      )}
    </>
  );
}
