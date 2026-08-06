'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  glass?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  bodyClassName,
  footer,
  glass = false,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 z-50 bg-brand-text/35 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <DialogPrimitive.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    // max-h (never a fixed px height) + flex-col so the body is the
                    // only part that scrolls — header/footer stay pinned in view.
                    'relative flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-brand-neutral-200 bg-brand-pearl shadow-xl dark:border-brand-neutral-800 dark:bg-brand-neutral-900 focus:outline-none sm:max-h-[90vh]',
                    glass && 'backdrop-blur-md bg-white/40 border-white/30 dark:bg-brand-neutral-900/40 dark:border-white/10',
                    className
                  )}
                >
                  {(title || description) && (
                    <div className="shrink-0 border-b border-brand-neutral-200/80 px-4 py-4 pr-12 dark:border-brand-neutral-800 sm:px-6">
                      {title && (
                        <DialogPrimitive.Title className="font-serif text-xl font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      {description && (
                        <DialogPrimitive.Description className="mt-1 font-sans text-sm text-brand-neutral-500 dark:text-brand-neutral-400">
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      'flex-1 overflow-y-auto px-4 py-4 font-sans text-brand-neutral-800 dark:text-brand-neutral-200 sm:px-6',
                      bodyClassName,
                    )}
                  >
                    {children}
                  </div>

                  {footer ? (
                    <div className="shrink-0 border-t border-brand-neutral-200/80 px-4 py-4 dark:border-brand-neutral-800 sm:px-6">
                      {footer}
                    </div>
                  ) : null}

                  <DialogPrimitive.Close asChild>
                    <button
                      className="absolute right-4 top-4 rounded-full p-1.5 text-brand-neutral-400 hover:bg-brand-neutral-100 hover:text-brand-neutral-900 dark:hover:bg-brand-neutral-800 dark:hover:text-brand-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                      aria-label="Cerrar modal"
                    >
                      <X className="size-4" />
                    </button>
                  </DialogPrimitive.Close>
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
