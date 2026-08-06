'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// z-index/position note: stacks directly above WhatsAppButton (h-14, bottom
// 1.5rem/24px + safe-area → top edge at 80px). This button sits at bottom
// 6rem/96px + safe-area, leaving a 16px gap between the two. `right` matches
// WhatsAppButton's exact offset (1.5rem + safe-area) for column alignment.
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrolled > 400);
      setProgress(maxScroll > 0 ? Math.min(scrolled / maxScroll, 1) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  if (!visible) return null;

  return (
    <motion.button
      onClick={scrollToTop}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-pearl shadow-[0_4px_18px_rgba(42,37,33,0.12)] [-webkit-tap-highlight-color:transparent]"
      aria-label="Volver arriba"
      style={{
        bottom: 'calc(6rem + env(safe-area-inset-bottom))',
        right: 'calc(1.5rem + env(safe-area-inset-right))',
      }}
    >
      {/* Gold fill ring — fills clockwise based on scroll progress */}
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        {/* Track sits on a white face now, so it uses the palette's line
            colour rather than a translucent gold that would disappear. */}
        <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="#E5DDD2" strokeWidth="2" />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="#C9A96E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>

      {/* Shimmer sweep on the button face */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, transparent 30%, rgba(201,169,110,0.28) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: prefersReduced ? 'none' : 'brisalGoldSweep 3s ease-in-out infinite',
          }}
        />
      </span>

      <ChevronUp className="relative z-10 h-5 w-5 text-brand-gold-deep" />
    </motion.button>
  );
}
