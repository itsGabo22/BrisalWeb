import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide font-body transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none border border-transparent',
  {
    variants: {
      variant: {
        nuevo: 'bg-badge-nuevo-bg text-badge-nuevo-fg border-brand-gold/25 shadow-sm',
        'mas-vendido': 'bg-badge-vendido-bg text-badge-vendido-fg border-brand-gold/25 shadow-sm',
        'en-oferta': 'bg-badge-oferta-bg text-badge-oferta-fg border-red-200/50 shadow-sm uppercase tracking-wider',
        tendencia: 'bg-badge-tendencia-bg text-badge-tendencia-fg border-purple-200/50 shadow-sm',
        mayorista: 'bg-badge-mayorista-bg text-badge-mayorista-fg border-brand-gold/35 shadow-sm uppercase tracking-wider',
      },
    },
    defaultVariants: {
      variant: 'nuevo',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
