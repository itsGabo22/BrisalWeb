'use client';

import * as React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import {
  m,
  AnimatePresence,
  useReducedMotion,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePageScroll } from '@/hooks/usePageScroll';
import type { HeroSlide } from '@/types';

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
const AUTO_ADVANCE_MS = 5000;
const SWIPE_THRESHOLD = 50;
const BRISAL_LETTERS = 'BRISAL'.split('');

// Scattered gold sparkle positions around the wordmark. `mobile: true` sparkles
// always render; the rest are desktop-only (sm:block), which keeps mobile at
// ~40% of the desktop particle count for older-iPhone GPU headroom.
const SPARKLES = [
  { top: '18%', left: '12%', size: 6, delay: 0, duration: 8, mobile: true },
  { top: '28%', left: '85%', size: 5, delay: 1.2, duration: 7, mobile: true },
  { top: '58%', left: '8%', size: 4, delay: 2.4, duration: 9, mobile: true },
  { top: '68%', left: '90%', size: 7, delay: 0.6, duration: 6.5, mobile: true },
  { top: '15%', left: '45%', size: 5, delay: 3, duration: 8.5, mobile: false },
  { top: '40%', left: '25%', size: 4, delay: 1.8, duration: 7.5, mobile: false },
  { top: '35%', left: '72%', size: 6, delay: 0.3, duration: 9.5, mobile: false },
  { top: '75%', left: '38%', size: 5, delay: 2.1, duration: 6, mobile: false },
  { top: '20%', left: '62%', size: 4, delay: 4, duration: 8, mobile: false },
  { top: '62%', left: '58%', size: 6, delay: 1.5, duration: 7, mobile: false },
] as const;

function HeroSparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[15]" aria-hidden="true">
      {SPARKLES.map((sparkle, index) => (
        <div
          key={index}
          className={cn(
            'brisal-sparkle absolute rounded-full',
            !sparkle.mobile && 'hidden sm:block',
          )}
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

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

// Letter-by-letter stagger for the "BRISAL" wordmark specifically.
const wordmarkContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const wordmarkLetterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function HeroCTAs({ ctaText, ctaHref }: { ctaText?: string | null; ctaHref?: string | null }) {
  return (
    <m.div
      variants={itemVariants}
      className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
    >
      <Button variant="primary" size="lg" asChild>
        <Link href={ctaHref || '/catalogo'}>{ctaText || 'Explorar Colección'}</Link>
      </Button>

      {whatsappNumber ? (
        <Button
          variant="ghost"
          size="lg"
          asChild
          className="gap-2 text-brand-neutral-100 hover:bg-white/10 hover:text-brand-gold-light"
        >
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={18} />
            Contactar por WhatsApp
          </a>
        </Button>
      ) : null}
    </m.div>
  );
}

/** Default gold/pearl branding block — used as the fallback (no slides) and whenever a slide has no title. */
function DefaultHeroCopy({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <m.p
        variants={itemVariants}
        className="font-serif text-xs tracking-[0.35em] text-brand-gold uppercase sm:text-sm"
      >
        Accesorios de distinción
      </m.p>

      <m.h1
        variants={reducedMotion ? itemVariantsReduced : wordmarkContainerVariants}
        className={cn(
          'mt-4 font-serif text-[clamp(4rem,12vw,9rem)] leading-[0.95] font-medium tracking-tight',
          reducedMotion ? 'text-brand-neutral-50' : 'brisal-wordmark',
        )}
      >
        {BRISAL_LETTERS.map((letter, index) => (
          <m.span
            key={index}
            variants={reducedMotion ? itemVariantsReduced : wordmarkLetterVariants}
            className="inline-block"
          >
            {letter}
          </m.span>
        ))}
      </m.h1>

      <m.p
        variants={itemVariants}
        className="mt-3 font-serif text-xl italic text-brand-gold-light sm:text-2xl md:text-3xl"
      >
        by Salvador
      </m.p>
    </>
  );
}

function SlideCopy({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <>
      <m.h1
        variants={itemVariants}
        className="font-serif text-[clamp(2.5rem,8vw,6rem)] leading-[1.05] font-medium tracking-tight text-brand-neutral-50"
      >
        {title}
      </m.h1>

      {subtitle ? (
        <m.p
          variants={itemVariants}
          className="mt-3 font-serif text-xl italic text-brand-gold-light sm:text-2xl md:text-3xl"
        >
          {subtitle}
        </m.p>
      ) : null}
    </>
  );
}

interface HeroSectionProps {
  slides?: HeroSlide[];
}

export function HeroSection({ slides = [] }: HeroSectionProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [scrolled, setScrolled] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const touchStartX = React.useRef(0);

  const { scrollY } = usePageScroll();
  const parallaxY = useTransform(scrollY, [0, 800], [0, -28]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40);
  });

  const hasSlides = slides.length > 0;
  const activeSlide = hasSlides ? slides[currentIndex % slides.length] : null;

  React.useEffect(() => {
    if (!hasSlides || slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [hasSlides, slides.length, isPaused]);

  const goToPrev = () => setCurrentIndex((i) => (i - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrentIndex((i) => (i + 1) % slides.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD) goToPrev();
    else if (delta < -SWIPE_THRESHOLD) goToNext();
  };

  return (
    <section
      aria-label="Presentación de marca"
      className="hero-viewport-height relative flex w-full items-center justify-center overflow-hidden bg-brand-neutral-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={hasSlides ? onTouchStart : undefined}
      onTouchEnd={hasSlides ? onTouchEnd : undefined}
    >
      {/* z-0 background */}
      {hasSlides && activeSlide ? (
        <AnimatePresence mode="wait">
          <m.div
            key={activeSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 z-0"
          >
            {activeSlide.type === 'VIDEO' ? (
              <video
                key={activeSlide.desktopUrl}
                src={activeSlide.desktopUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <NextImage
                  src={activeSlide.desktopUrl}
                  alt=""
                  fill
                  priority={currentIndex === 0}
                  sizes="100vw"
                  className="hidden object-cover sm:block"
                />
                <NextImage
                  src={activeSlide.mobileUrl || activeSlide.desktopUrl}
                  alt=""
                  fill
                  priority={currentIndex === 0}
                  sizes="100vw"
                  className="object-cover sm:hidden"
                />
              </>
            )}
          </m.div>
        </AnimatePresence>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-neutral-900 via-[#0F0E0C] to-brand-neutral-800"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(201,169,110,0.12),transparent)]"
            aria-hidden="true"
          />
        </>
      )}

      {/* z-10 dark overlay */}
      {hasSlides && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-black/45" aria-hidden="true" />
      )}

      {/* Gold sparkles — behind the content, above the background/overlay */}
      <HeroSparkles />

      {/* z-20 content — CTAs always render regardless of slide data */}
      <m.div
        style={{ y: reducedMotion ? 0 : parallaxY }}
        className="relative z-20 flex w-full max-w-4xl flex-col items-center px-6 text-center"
      >
        <m.div
          key={activeSlide?.id ?? 'default'}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {reducedMotion ? (
            <m.div variants={itemVariantsReduced}>
              {activeSlide?.title ? (
                <SlideCopy title={activeSlide.title} subtitle={activeSlide.subtitle} />
              ) : (
                <DefaultHeroCopy reducedMotion={reducedMotion} />
              )}
            </m.div>
          ) : activeSlide?.title ? (
            <SlideCopy title={activeSlide.title} subtitle={activeSlide.subtitle} />
          ) : (
            <DefaultHeroCopy reducedMotion={reducedMotion} />
          )}

          <m.div
            variants={reducedMotion ? itemVariantsReduced : itemVariants}
            className={cn(
              'mt-8 h-px bg-brand-gold',
              reducedMotion ? 'w-16' : 'brisal-divider-line',
            )}
            aria-hidden="true"
          />

          <HeroCTAs ctaText={activeSlide?.ctaText} ctaHref={activeSlide?.ctaHref} />
        </m.div>
      </m.div>

      {/* Manual arrows */}
      {hasSlides && slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Slide anterior"
            className="absolute left-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95 sm:left-6"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Siguiente slide"
            className="absolute right-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95 sm:right-6"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Ir al slide ${index + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === currentIndex ? 'w-6 bg-brand-gold' : 'w-1.5 bg-white/40 hover:bg-white/60',
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Scroll indicator — only in the default (no-slides) state */}
      {!hasSlides && (
        <m.div
          initial={{ opacity: 1 }}
          animate={{ opacity: scrolled ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'absolute bottom-8 left-1/2 z-20 -translate-x-1/2',
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
        </m.div>
      )}
    </section>
  );
}
