'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFrameCardProps {
  label: string;
  sublabel?: string;
  helperText?: string;
  /** Tailwind aspect-ratio class, e.g. 'aspect-video', 'aspect-[9/16]', 'aspect-square'. */
  aspectClassName: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: 'image' | 'video';
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  accept: string;
  className?: string;
}

/** Device-shaped silhouette upload card — dashed empty state, thumbnail fill once media is set, "Cambiar" on hover. */
export function MediaFrameCard({
  label,
  sublabel,
  helperText,
  aspectClassName,
  icon: Icon,
  kind,
  file,
  existingUrl,
  onChange,
  accept,
  className,
}: MediaFrameCardProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      void Promise.resolve().then(() => setObjectUrl(null));
      return;
    }
    const url = URL.createObjectURL(file);
    void Promise.resolve().then(() => setObjectUrl(url));
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = objectUrl ?? existingUrl ?? null;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="font-sans text-xs font-semibold text-brand-neutral-600 dark:text-brand-neutral-300">
        {label}
      </span>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group relative w-full overflow-hidden rounded-lg border-2 transition-colors',
          aspectClassName,
          previewUrl
            ? 'border-brand-neutral-200 dark:border-brand-neutral-800'
            : 'border-dashed border-brand-neutral-300 hover:border-brand-gold dark:border-brand-neutral-700',
        )}
      >
        {previewUrl ? (
          <>
            {kind === 'video' ? (
              <video src={previewUrl} className="h-full w-full object-cover" muted />
            ) : (
              // Local blob: URLs and arbitrary remote URLs aren't compatible with next/image's
              // optimizer, and this is an admin-only preview — a plain <img> is the right tool.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-neutral-800">
                <RefreshCw className="size-3.5" />
                Cambiar
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <Icon className="size-8 text-brand-neutral-300 dark:text-brand-neutral-700" />
            <span className="font-sans text-xs text-brand-neutral-400">Haz clic o arrastra</span>
          </div>
        )}
      </button>

      {sublabel && <span className="font-sans text-[11px] text-brand-neutral-400">{sublabel}</span>}
      {helperText && <p className="font-sans text-[11px] text-brand-neutral-400">{helperText}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="hidden"
      />
    </div>
  );
}
