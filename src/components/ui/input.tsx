import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body text-sm font-normal tracking-[0.04em] text-brand-text dark:text-brand-neutral-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            // text-base (16px) prevents iOS Safari's auto-zoom-on-focus for any input
            // under 16px; sm:text-sm restores the original compact size on desktop,
            // where that zoom behavior doesn't apply.
            'flex h-10 w-full rounded-md border border-brand-line bg-brand-pearl px-3 py-2 text-base sm:text-sm text-brand-text placeholder:text-brand-text-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:border-brand-gold disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="font-body text-xs text-red-500 mt-0.5" id={`${inputId}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
