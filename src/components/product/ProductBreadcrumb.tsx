import Link from 'next/link';

import { categoryRepository } from '@/lib/repositories';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductBreadcrumbProps {
  product: Product;
}

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export async function ProductBreadcrumb({ product }: ProductBreadcrumbProps) {
  const categories = await categoryRepository.getAll();
  const parentCategory = product.category.parentId
    ? categories.find((category) => category.id === product.category.parentId)
    : undefined;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/' },
    { label: 'Catálogo', href: '/catalogo' },
    ...(parentCategory
      ? [
          {
            label: parentCategory.name,
            href: `/catalogo/${parentCategory.slug}`,
          },
        ]
      : []),
    {
      label: product.category.name,
      href: parentCategory
        ? `/catalogo/${parentCategory.slug}/${product.category.slug}`
        : `/catalogo/${product.category.slug}`,
    },
    { label: product.name },
  ];

  return (
    <header className="border-b border-brand-gold/30 bg-brand-pearl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <nav className="font-sans text-xs" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-brand-neutral-500">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li
                  key={`${item.label}-${index}`}
                  className="flex items-center gap-2"
                >
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
      </div>
    </header>
  );
}
