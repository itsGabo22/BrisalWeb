'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ProductGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  const handleSelect = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  // ── Empty / no-image state ───────────────────────────
  if (images.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-brand-neutral-100',
          'aspect-square w-full',
          className,
        )}
        aria-label={`Sin imagen disponible para ${productName}`}
        role="img"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-neutral-300"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* ── Main image ──────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-brand-neutral-100"
        style={{ aspectRatio: '4 / 5' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Image
              src={images[activeIndex]}
              alt={`${productName} — imagen ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Thumbnails ──────────────────────────────────── */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="list"
          aria-label={`Imágenes de ${productName}`}
        >
          {images.map((src, index) => (
            <button
              key={src}
              role="listitem"
              onClick={() => handleSelect(index)}
              aria-label={`Ver imagen ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2',
                index === activeIndex
                  ? 'border-brand-gold shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-brand-neutral-300',
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
