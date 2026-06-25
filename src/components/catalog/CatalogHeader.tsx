import Link from 'next/link';

import { cn } from '@/lib/utils';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export interface CatalogHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  className?: string;
}

export function CatalogHeader({
  title,
  subtitle,
  breadcrumbs,
  className,
}: CatalogHeaderProps) {
  return (
    <header
      className={cn(
        'border-b border-brand-gold/30 bg-brand-pearl',
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <nav className="font-sans text-xs" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-brand-neutral-500">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-brand-gold-light" aria-hidden="true">
                      /
                    </span>
                  )}
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-brand-gold focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        isLast && 'font-medium text-brand-neutral-800',
                      )}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="max-w-3xl">
          <h1 className="font-serif text-3xl font-semibold uppercase tracking-wider leading-tight text-brand-neutral-900 sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 font-sans text-sm leading-6 text-brand-neutral-600 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
