'use client';

import * as React from 'react';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

const SIZES = { sm: 12, md: 16, lg: 22 } as const;
export type StarSize = keyof typeof SIZES;

interface StarsProps {
  /** 0-5, fractional allowed for an average. */
  value: number;
  size?: StarSize;
  className?: string;
  /** Screen-reader text; omit when a sibling already says the number. */
  label?: string;
}

/**
 * Read-only stars, including half-filled ones for an average like 4.3.
 *
 * Drawn as two stacked rows — grey outlines underneath, gold ones on top
 * clipped to a percentage width — rather than by rounding to the nearest half
 * star. Rounding would show 4.4 and 4.6 identically, which is exactly the
 * distinction a shopper comparing two products is looking for.
 */
export function Stars({ value, size = 'md', className, label }: StarsProps) {
  const px = SIZES[size];
  const clamped = Math.max(0, Math.min(5, value));
  const filledWidth = `${(clamped / 5) * 100}%`;

  return (
    <span
      className={cn('relative inline-flex shrink-0 leading-none', className)}
      role="img"
      aria-label={label ?? `${clamped.toFixed(1)} de 5 estrellas`}
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={px} className="text-brand-line" fill="currentColor" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden"
        style={{ width: filledWidth }}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={px}
            className="text-brand-gold shrink-0"
            fill="currentColor"
          />
        ))}
      </span>
    </span>
  );
}

interface StarPickerProps {
  value: number;
  onChange: (value: number) => void;
  /** Rendered inside a form; surfaces the required-field error. */
  invalid?: boolean;
}

/**
 * The 1-5 picker used in the submit form.
 *
 * A radiogroup of real buttons rather than a hover-tracked strip: the shopper
 * has to be able to set this with a keyboard, and arrow keys on a radiogroup is
 * the behaviour screen-reader users already expect.
 */
export function StarPicker({ value, onChange, invalid }: StarPickerProps) {
  const [hovered, setHovered] = React.useState(0);
  const shown = hovered || value;

  return (
    <div
      role="radiogroup"
      aria-label="Calificación"
      aria-required="true"
      className={cn(
        'inline-flex items-center gap-1 rounded-md p-1',
        invalid && 'ring-2 ring-red-400',
      )}
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(0)}
          className="focus-visible:ring-brand-gold rounded p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Star
            size={26}
            className={cn(
              'transition-colors',
              star <= shown ? 'text-brand-gold' : 'text-brand-line',
            )}
            fill="currentColor"
          />
        </button>
      ))}
      <span className="text-brand-text-soft ml-2 font-body text-sm tabular-nums">
        {value > 0 ? `${value}/5` : ''}
      </span>
    </div>
  );
}
