'use client';

import Link from 'next/link';
import { Clock, User, UserCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useWholesaleSession } from '@/hooks/useWholesaleSession';

const CONFIG = {
  loading: { href: '/login', label: 'Ingresar', icon: User },
  guest: { href: '/login', label: 'Ingresar', icon: User },
  pending: {
    href: '/mayoristas/pendiente',
    label: 'Solicitud pendiente',
    icon: Clock,
  },
  approved: { href: '/catalogo', label: 'Cuenta mayorista', icon: UserCheck },
} as const;

/** Desktop header icon: routes to login, pending review, or the wholesale account depending on session state. */
export function WholesaleNavIndicator() {
  const status = useWholesaleSession();
  const { href, label, icon: Icon } = CONFIG[status];

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'text-brand-neutral-700 hover:bg-brand-gold/10 hover:text-brand-gold focus-visible:ring-brand-gold flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none',
        status === 'approved' && 'text-brand-gold',
      )}
    >
      <Icon size={18} />
    </Link>
  );
}

/** Mobile nav row variant — matches MobileNavLink markup. */
export function WholesaleNavLink({ onClick }: { onClick: () => void }) {
  const status = useWholesaleSession();
  const { href, label, icon: Icon } = CONFIG[status];

  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-brand-neutral-700 hover:bg-brand-neutral-100 hover:text-brand-gold focus-visible:ring-brand-gold flex items-center gap-3 rounded-lg px-4 py-3 font-sans text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span aria-hidden="true">
        <Icon size={16} />
      </span>
      {label}
    </Link>
  );
}
