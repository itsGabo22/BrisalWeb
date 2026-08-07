import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-body text-sm font-normal tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        // The site's one CTA style: a pearl pill with a gold hairline, filling
        // to a soft gold wash on hover. Replaces the solid #C9A96E fill — gold
        // now reads as an accent (the border, the hover tint) rather than a
        // slab of colour.
        primary:
          'bg-brand-pearl text-brand-text border border-brand-gold/70 shadow-sm hover:bg-brand-gold/10 hover:border-brand-gold hover:shadow-md dark:text-brand-text',
        secondary:
          'bg-brand-cream text-brand-text border border-brand-line hover:bg-brand-sand hover:border-brand-gold/40 dark:bg-brand-neutral-800 dark:text-brand-neutral-200 dark:border-brand-neutral-700 dark:hover:bg-brand-neutral-700',
        ghost:
          'text-brand-gold-deep hover:bg-brand-gold/10 hover:text-brand-text active:bg-brand-gold/15',
        /**
         * Frosted glass, for CTAs that sit ON hero imagery. The visual work
         * lives in `.hero-glass-cta` in globals.css — see the comment there
         * for why it is hand-written (iOS prefix, backdrop darkening, and the
         * no-backdrop-filter fallback). Don't reuse this on a flat light
         * section: it has nothing to frost there.
         */
        glass: 'hero-glass-cta text-white font-medium',
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
