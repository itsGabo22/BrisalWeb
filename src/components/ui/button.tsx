import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-gold text-brand-neutral-900 shadow-md hover:bg-brand-gold/90 hover:shadow-brand-gold/20 hover:shadow-lg dark:text-brand-neutral-900',
        secondary:
          'bg-brand-neutral-100 text-brand-neutral-800 border border-brand-neutral-200 hover:bg-brand-neutral-200 hover:text-brand-neutral-950 dark:bg-brand-neutral-800 dark:text-brand-neutral-200 dark:border-brand-neutral-700 dark:hover:bg-brand-neutral-700',
        ghost:
          'text-brand-gold hover:bg-brand-gold/10 hover:text-brand-gold-light active:bg-brand-gold/15',
      },
      size: {
        sm: 'h-9 px-3 text-xs rounded-sm',
        md: 'h-10 px-5 text-sm rounded-md',
        lg: 'h-12 px-8 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = (asChild ? Slot.Root : 'button') as React.ElementType;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
