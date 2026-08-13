'use client';

import * as React from 'react';
import { Crosshair, Monitor, Smartphone, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Clamp to the 0-100 the column and CSS object-position both expect. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export interface FocalPoint {
  x: number;
  y: number;
}

export const CENTER: FocalPoint = { x: 50, y: 50 };

interface FocalFrameProps {
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind aspect class matching the real device frame. */
  aspectClassName: string;
  kind: 'image' | 'video';
  /** Media to preview, or null when nothing has been uploaded yet. */
  url: string | null;
  posterUrl?: string | null;
  value: FocalPoint;
  onChange: (next: FocalPoint) => void;
  className?: string;
}

/**
 * One device frame showing the real media cropped exactly as the live section
 * will crop it, with a draggable focal marker on top.
 *
 * The marker means "keep THIS part of the picture": it maps 1:1 to
 * `object-position`, where `70% 30%` lines the point 70% across / 30% down the
 * MEDIA up with the same point of the FRAME. Dragging right therefore reveals
 * more of the right-hand side, which is what an admin expects.
 *
 * Worth knowing: object-position can only move an axis that actually overflows.
 * Media whose aspect ratio already matches the frame has nothing to slide, so
 * the crop will not visibly change on that axis — that is `object-cover`
 * working correctly, not a broken control.
 */
function FocalFrame({
  label,
  hint,
  icon: Icon,
  aspectClassName,
  kind,
  url,
  posterUrl,
  value,
  onChange,
  className,
}: FocalFrameProps) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const setFromPointer = React.useCallback(
    (clientX: number, clientY: number) => {
      const el = frameRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      onChange({
        x: clampPercent(((clientX - rect.left) / rect.width) * 100),
        y: clampPercent(((clientY - rect.top) / rect.height) * 100),
      });
    },
    [onChange],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!url) return;
    // Capture on the frame itself so a fast drag that leaves the box keeps
    // feeding move events instead of stranding the marker mid-gesture.
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setFromPointer(e.clientX, e.clientY);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  /**
   * Arrow keys nudge the marker. A drag-only control is unusable without a
   * pointer, and this is also how you land an exact value — 1% a press, 10%
   * with Shift.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!url) return;
    const step = e.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    onChange({ x: clampPercent(value.x + move[0]), y: clampPercent(value.y + move[1]) });
  };

  const objectPosition = `${value.x}% ${value.y}%`;
  const isCentered = value.x === 50 && value.y === 50;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-brand-gold" />
        <span className="font-sans text-xs font-semibold text-brand-neutral-600 dark:text-brand-neutral-300">
          {label}
        </span>
      </div>

      <div
        ref={frameRef}
        role="application"
        aria-label={`Punto focal ${label}. Arrastra o usa las flechas. Actualmente ${value.x}% horizontal, ${value.y}% vertical.`}
        tabIndex={url ? 0 : -1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative w-full overflow-hidden rounded-lg border-2 bg-brand-neutral-100 dark:bg-brand-neutral-950',
          aspectClassName,
          url
            ? 'border-brand-neutral-200 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none dark:border-brand-neutral-800'
            : 'border-dashed border-brand-neutral-300 dark:border-brand-neutral-700',
          url && (isDragging ? 'cursor-grabbing touch-none' : 'cursor-grab touch-none'),
        )}
      >
        {url ? (
          <>
            {kind === 'video' ? (
              /* autoplay + muted + loop + playsInline mirrors the live site, so
                 the admin frames the video on the same moment shoppers see. The
                 poster covers the gap before the first frame decodes. */
              <video
                key={url}
                src={url}
                poster={posterUrl ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="pointer-events-none h-full w-full object-cover"
                style={{ objectPosition }}
              />
            ) : (
              // blob: URLs and arbitrary remote URLs aren't compatible with
              // next/image's optimizer, and this is an admin-only preview.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                className="pointer-events-none h-full w-full object-cover"
                style={{ objectPosition }}
              />
            )}

            {/* Reticle. White ring over a dark ring so it stays visible on both
                a blown-out sky and a black backdrop. */}
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${value.x}%`, top: `${value.y}%` }}
              aria-hidden="true"
            >
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.55)] transition-transform',
                  isDragging && 'scale-110',
                )}
              >
                <span className="size-1.5 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.55)]" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <Crosshair className="size-6 text-brand-neutral-300 dark:text-brand-neutral-700" />
            <span className="font-sans text-[11px] text-brand-neutral-400">
              Sube un archivo para ajustar el encuadre
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-[11px] tabular-nums text-brand-neutral-400">
          {url ? `${value.x}% · ${value.y}%` : hint}
        </span>
        {url && !isCentered && (
          <button
            type="button"
            onClick={() => onChange(CENTER)}
            className="flex items-center gap-1 font-sans text-[11px] font-medium text-brand-gold-deep transition-colors hover:text-brand-gold"
          >
            <Undo2 className="size-3" />
            Restablecer al centro
          </button>
        )}
      </div>
    </div>
  );
}

export interface MediaFocalPreviewProps {
  /** Media the desktop frame shows — the desktop image, or the video. */
  desktopUrl: string | null;
  /**
   * Media the mobile frame shows. Pass the desktop media when no dedicated
   * mobile file exists, exactly as the live section falls back.
   */
  mobileUrl: string | null;
  kind: 'image' | 'video';
  posterUrl?: string | null;
  /** True when the mobile frame is previewing the desktop media. */
  mobileIsFallback: boolean;
  desktop: FocalPoint;
  mobile: FocalPoint;
  onDesktopChange: (next: FocalPoint) => void;
  onMobileChange: (next: FocalPoint) => void;
  /**
   * Frame shapes, defaulting to the full-bleed hero's. A preview is only
   * trustworthy if it crops at the ratio the real section crops at, and not
   * every band is full-screen — the wholesale band is a short content strip,
   * so it passes its own.
   */
  desktopAspectClassName?: string;
  mobileAspectClassName?: string;
}

/**
 * The two device frames, side by side, each with its own independent focal
 * point — which is the whole point: a portrait phone crop of a landscape photo
 * usually has to keep a different part of it than the desktop crop does.
 *
 * Deliberately shared rather than copied per section: this is ~200 lines of
 * pointer-capture, keyboard-nudge and reticle behaviour, and a second copy
 * would drift from the first the moment either is touched.
 */
export function MediaFocalPreview({
  desktopUrl,
  mobileUrl,
  kind,
  posterUrl,
  mobileIsFallback,
  desktop,
  mobile,
  onDesktopChange,
  onMobileChange,
  desktopAspectClassName = 'aspect-video',
  mobileAspectClassName = 'aspect-[9/16]',
}: MediaFocalPreviewProps) {
  return (
    <div className="rounded-lg border border-brand-neutral-100 bg-brand-neutral-50/60 p-4 dark:border-brand-neutral-800 dark:bg-brand-neutral-950/40">
      <div className="flex items-center gap-1.5">
        <Crosshair className="size-4 text-brand-gold" />
        <h3 className="font-sans text-sm font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
          Vista previa y punto focal
        </h3>
      </div>
      <p className="mt-1 font-sans text-[11px] leading-relaxed text-brand-neutral-400">
        Así se verá en cada dispositivo. Arrastra el punto (o usa las flechas del
        teclado) para elegir qué parte del archivo se conserva al recortar. Cada
        pantalla se ajusta por separado.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <FocalFrame
          label="Escritorio"
          hint="Sin archivo"
          icon={Monitor}
          aspectClassName={desktopAspectClassName}
          kind={kind}
          url={desktopUrl}
          posterUrl={posterUrl}
          value={desktop}
          onChange={onDesktopChange}
          className="sm:w-3/5"
        />
        <FocalFrame
          label="Móvil"
          hint="Sin archivo"
          icon={Smartphone}
          aspectClassName={mobileAspectClassName}
          kind={kind}
          url={mobileUrl}
          posterUrl={posterUrl}
          value={mobile}
          onChange={onMobileChange}
          className="sm:w-2/5"
        />
      </div>

      {mobileIsFallback && mobileUrl && (
        <p className="mt-3 font-sans text-[11px] text-brand-neutral-400">
          El móvil está usando el archivo de escritorio (no se subió uno propio),
          igual que hará el sitio.
        </p>
      )}
    </div>
  );
}
