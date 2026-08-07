'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface CatalogPaginationProps {
  page: number;
  totalPages: number;
}

/**
 * Page links carry the whole existing query string, so pagination composes
 * with the filters rather than replacing them. The sidebar and the chips both
 * delete `page` when they change a filter, which is what resets the shopper to
 * page 1 on every new narrowing.
 *
 * Real <Link>s rather than buttons: a page is a distinct, shareable URL and
 * should be openable in a new tab.
 */
export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = React.useCallback(
    (target: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (target <= 1) params.delete('page');
      else params.set('page', String(target));
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams],
  );

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-1.5"
      aria-label="Paginación del catálogo"
    >
      <PageArrow
        href={hrefFor(page - 1)}
        disabled={page === 1}
        label="Página anterior"
        icon={<ChevronLeft className="size-4" aria-hidden="true" />}
      />

      {pages.map((target) => (
        <Link
          key={target}
          href={hrefFor(target)}
          scroll={false}
          aria-current={target === page ? 'page' : undefined}
          className={cn(
            'focus-visible:ring-brand-gold flex size-9 items-center justify-center rounded-full border font-body text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none',
            target === page
              ? 'border-brand-gold bg-brand-gold/12 text-brand-gold-deep'
              : 'border-brand-line text-brand-text-soft hover:border-brand-gold/60 hover:text-brand-text',
          )}
        >
          {target}
        </Link>
      ))}

      <PageArrow
        href={hrefFor(page + 1)}
        disabled={page === totalPages}
        label="Página siguiente"
        icon={<ChevronRight className="size-4" aria-hidden="true" />}
      />
    </nav>
  );
}

function PageArrow({
  href,
  disabled,
  label,
  icon,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  const className = cn(
    'border-brand-line flex size-9 items-center justify-center rounded-full border transition-colors',
    disabled
      ? 'text-brand-text-soft/40 cursor-default'
      : 'text-brand-text hover:border-brand-gold/60 hover:text-brand-gold-deep focus-visible:ring-brand-gold focus-visible:ring-2 focus-visible:outline-none',
  );

  // A disabled arrow renders as a span, not a dead link — nothing to focus and
  // nothing to activate.
  if (disabled) {
    return (
      <span className={className} aria-hidden="true">
        {icon}
      </span>
    );
  }

  return (
    <Link href={href} scroll={false} aria-label={label} className={className}>
      {icon}
    </Link>
  );
}
