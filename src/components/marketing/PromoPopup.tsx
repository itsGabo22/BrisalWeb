'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PromoPopupData {
  id: string;
  active: boolean;
  imageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  showOnce: boolean;
}

interface PromoPopupProps {
  popup: PromoPopupData | null;
}

const SHOW_DELAY_MS = 1500;

export function PromoPopup({ popup }: PromoPopupProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!popup || !popup.active) return;

    const storageKey = `brisal-popup-${popup.id}`;
    if (popup.showOnce && window.localStorage.getItem(storageKey)) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      if (popup.showOnce) {
        window.localStorage.setItem(storageKey, '1');
      }
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [popup]);

  if (!popup) return null;

  const handleClose = () => setIsVisible(false);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={popup.title ?? 'Oferta especial'}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-brand-pearl shadow-2xl"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-brand-neutral-700 shadow-sm transition-colors hover:bg-white hover:text-brand-neutral-900 active:scale-95"
            >
              <X className="size-4" />
            </button>

            {popup.imageUrl && (
              <div className="relative aspect-[4/3] w-full">
                <Image src={popup.imageUrl} alt="" fill sizes="384px" className="object-cover" />
              </div>
            )}

            <div className="p-6 text-center">
              {popup.title && (
                <h2 className="font-serif text-2xl font-semibold text-brand-neutral-900">
                  {popup.title}
                </h2>
              )}
              {popup.subtitle && (
                <p className="mt-2 font-sans text-sm text-brand-neutral-600">{popup.subtitle}</p>
              )}
              {popup.ctaHref && (
                <Button asChild className="mt-6 w-full" onClick={handleClose}>
                  <Link href={popup.ctaHref}>{popup.ctaText || 'Ver oferta'}</Link>
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
