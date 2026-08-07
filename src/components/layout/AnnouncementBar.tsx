'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Matches cornalinaaccesorios.com's announcement slider (autoplay="5"). */
const ROTATE_MS = 5000;

/**
 * Splits the SiteConfig string into messages — one per line.
 *
 * Deliberately not a schema change. `SiteConfig.announcementText` is a single
 * String column, and treating newlines as the separator gives the client real
 * multi-message control from the existing admin field without a migration.
 * A single-line value keeps behaving exactly as it did before.
 */
export function parseAnnouncements(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Cornalina emphasises the money in each message (their markup wraps it in an
 * <em>, rendered italic at weight 500). Rather than make the client hand-write
 * markup in a plain admin textarea, the amount is detected and emphasised
 * automatically. Anything that isn't a currency amount is left untouched.
 */
// Split keeps the capture group, so amounts land on the ODD indices of the
// result. Testing each part with a separate non-global regex would work too,
// but relying on the split's own parity avoids any lastIndex statefulness.
const AMOUNT_SPLIT = /(\$\s?[\d.,]+)/;

function EmphasisedMessage({ text }: { text: string }) {
  const parts = text.split(AMOUNT_SPLIT);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-medium">
            {part}
          </strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

export interface AnnouncementBarProps {
  /** Raw SiteConfig value; one message per line. */
  text: string;
  active: boolean;
}

export function AnnouncementBar({ text, active }: AnnouncementBarProps) {
  const messages = React.useMemo(() => parseAnnouncements(text), [text]);
  const [index, setIndex] = React.useState(0);
  // Direction only drives the slide animation; +1 forward, -1 back.
  const [direction, setDirection] = React.useState(1);
  const reducedMotion = useReducedMotion();

  const count = messages.length;
  const hasMultiple = count > 1;

  const go = React.useCallback(
    (delta: number) => {
      setDirection(delta);
      setIndex((prev) => (prev + delta + count) % count);
    },
    [count],
  );

  React.useEffect(() => {
    if (!hasMultiple || !active) return;
    const timer = setInterval(() => go(1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [hasMultiple, active, go]);

  if (!active || count === 0) return null;

  const slide = 12;

  return (
    <div
      className="bg-brand-sand border-brand-line relative w-full border-b"
      role="region"
      aria-label="Anuncios de la tienda"
    >
      {/* min-h rather than a fixed h: on a narrow screen a long offer is
          allowed to take two lines and grow the bar, which is always better
          than hiding half the offer. Horizontal padding only has to clear the
          arrows, so it tracks their size. */}
      <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-center px-9 py-1.5 sm:min-h-11 sm:px-14">
        {hasMultiple && (
          <ArrowButton
            side="left"
            label="Anuncio anterior"
            onClick={() => go(-1)}
          />
        )}

        {/* aria-live so a screen reader announces each rotation, but politely.
            Deliberately NOT overflow-hidden: that clipped the second line
            whenever a long offer wrapped on a narrow screen, which is the very
            failure this bar is meant to avoid. There is nothing to clip anyway
            — AnimatePresence runs in `mode="wait"`, so only one message exists
            at a time, and its slide is 12px inside a full-width bar. */}
        <div
          className="relative flex min-w-0 flex-1 items-center justify-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={index}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * slide }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * -slide }
              }
              transition={{ duration: reducedMotion ? 0.15 : 0.3, ease: 'easeOut' }}
              // Deliberately NOT truncated. A cut-off promotion ("...SUPERIORES
              // A $") is worse than a two-line one, so the message wraps
              // instead. Type and tracking both step down on small screens so
              // the common offers still land on a single line at 375px.
              className="text-brand-text text-center font-body text-[10px] leading-relaxed font-light tracking-[0.06em] text-balance uppercase sm:text-[11px] sm:tracking-[0.12em] md:text-xs"
            >
              <EmphasisedMessage text={messages[index]} />
            </motion.p>
          </AnimatePresence>
        </div>

        {hasMultiple && (
          <ArrowButton
            side="right"
            label="Siguiente anuncio"
            onClick={() => go(1)}
          />
        )}
      </div>
    </div>
  );
}

function ArrowButton({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      // Tighter and smaller on mobile so the arrows claim as little of the
      // narrow line as possible; the tap target stays >=28px either way.
      className={`text-brand-text-soft hover:text-brand-gold-deep focus-visible:ring-brand-gold absolute top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none sm:size-8 ${
        side === 'left' ? 'left-0 sm:left-3' : 'right-0 sm:right-3'
      }`}
    >
      <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
    </button>
  );
}
