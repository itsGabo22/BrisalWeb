'use client';

import * as React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { ParallaxBackdrop } from '@/components/marketing/ParallaxBackdrop';
import { cn } from '@/lib/utils';

interface BrandStatementProps {
  /**
   * Admin-configured parallax backdrop. Null is a supported, finished state —
   * the band falls back to the flat cream it shipped with rather than to a
   * placeholder, so nothing looks broken before the client uploads anything.
   */
  backgroundUrl?: string | null;
}

export function BrandStatement({ backgroundUrl }: BrandStatementProps) {
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const reducedMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      aria-label="Declaración de marca"
      className={cn(
        'bg-brand-cream px-6 py-20 md:py-28',
        // Only needed once there is a photo to contain and position against.
        backgroundUrl && 'relative overflow-hidden',
      )}
    >
      {backgroundUrl && (
        // A LIGHT scrim, not a dark one: this band's copy is brand-text, and
        // the palette rule is that nothing dark is used as a surface. 80%
        // cream keeps the section reading as a light surface while still
        // letting the photo through as depth. Against a worst-case near-black
        // upload it lands around #CDCBC6, where brand-text holds ~9.3:1.
        <ParallaxBackdrop src={backgroundUrl} overlayClassName="bg-brand-cream/80" />
      )}

      <motion.div
        initial={{ opacity: reducedMotion ? 1 : 0 }}
        animate={{ opacity: isInView ? 1 : reducedMotion ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 1.5, ease: 'easeOut' }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <p className="font-heading text-[clamp(2rem,5vw,4rem)] leading-tight font-medium text-brand-text">
          Cada pieza, una historia.
        </p>
        <p
          className={cn(
            'mx-auto mt-6 max-w-xl font-body text-base leading-relaxed md:text-lg',
            // brand-text-soft only clears AA on the flat cream. Over a photo —
            // even behind the scrim — it drops to ~3.7:1 on a dark upload, so
            // the band steps up to the primary token instead of shipping
            // secondary copy that fails on some images and passes on others.
            backgroundUrl ? 'text-brand-text' : 'text-brand-text-soft',
          )}
        >
          Accesorios en acero y rodio diseñados para acompañar cada momento
          especial.
        </p>
      </motion.div>
    </section>
  );
}
