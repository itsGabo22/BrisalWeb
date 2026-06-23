'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const itemVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};

export function HeroSection() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = React.useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setScrolled(value > 0.05);
  });

  return (
    <section
      ref={sectionRef}
      aria-label="Presentación de marca"
      className="relative flex h-[100dvh] min-h-[600px] w-full items-center justify-center overflow-hidden bg-brand-neutral-900"
    >
      {/* Premium dark gradient — no background image until client provides assets */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-neutral-900 via-[#0F0E0C] to-brand-neutral-800"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(204,164,45,0.12),transparent)]"
        aria-hidden="true"
      />

      <motion.div
        style={{ y: reducedMotion ? 0 : parallaxY }}
        className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 text-center"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.p
            variants={reducedMotion ? itemVariantsReduced : itemVariants}
            className="font-serif text-xs tracking-[0.35em] text-brand-gold uppercase sm:text-sm"
          >
            Accesorios de distinción
          </motion.p>

          <motion.h1
            variants={reducedMotion ? itemVariantsReduced : itemVariants}
            className="mt-4 font-serif text-[clamp(4rem,12vw,9rem)] leading-[0.95] font-medium tracking-tight text-brand-neutral-50"
          >
            BRISAL
          </motion.h1>

          <motion.p
            variants={reducedMotion ? itemVariantsReduced : itemVariants}
            className="mt-3 font-serif text-xl italic text-brand-gold-light sm:text-2xl md:text-3xl"
          >
            by Salvador
          </motion.p>

          <motion.div
            variants={reducedMotion ? itemVariantsReduced : itemVariants}
            className="mt-8 h-px w-20 bg-brand-gold"
            aria-hidden="true"
          />

          <motion.div
            variants={reducedMotion ? itemVariantsReduced : itemVariants}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
          >
            <Button variant="primary" size="lg" asChild>
              <Link href="/catalogo">Explorar Colección</Link>
            </Button>

            {whatsappNumber ? (
              <Button
                variant="ghost"
                size="lg"
                asChild
                className="gap-2 text-brand-neutral-100 hover:bg-white/10 hover:text-brand-gold-light"
              >
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon size={18} />
                  Contactar por WhatsApp
                </a>
              </Button>
            ) : null}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'absolute bottom-8 left-1/2 z-10 -translate-x-1/2',
          scrolled && 'pointer-events-none',
        )}
        aria-hidden="true"
      >
        <ChevronDown
          className={cn(
            'h-6 w-6 text-brand-gold-light/70',
            !reducedMotion && 'motion-safe:animate-[hero-bounce_2s_ease-in-out_infinite]',
          )}
        />
      </motion.div>
    </section>
  );
}
