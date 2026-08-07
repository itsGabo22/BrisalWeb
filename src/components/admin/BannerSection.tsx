'use client';

import * as React from 'react';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SiteConfig {
  announcementText: string;
  announcementActive: boolean;
}

export function BannerSection() {
  const [config, setConfig] = React.useState<SiteConfig | null>(null);
  const [text, setText] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadConfig = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site-config');
      if (res.ok) {
        const data = (await res.json()) as SiteConfig;
        setConfig(data);
        setText(data.announcementText);
        setActive(data.announcementActive);
      }
    } catch (err) {
      console.error('Error loading site config:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadConfig());
  }, [loadConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSavedMsg(null);

    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementText: text, announcementActive: active }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? 'Error al guardar el banner');
      }
      setSavedMsg('Guardado correctamente.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = config && (text !== config.announcementText || active !== config.announcementActive);

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 flex items-center gap-2">
        <Megaphone className="size-5 text-brand-gold" />
        <span>Banner superior</span>
      </h2>
      <p className="mt-1 font-sans text-xs text-brand-neutral-400">
        Los mensajes que rotan en la franja sobre el encabezado.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-24 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 space-y-4 font-sans text-sm">
          {/* A textarea, not an input: the bar treats each LINE as a separate
              rotating message. That keeps multi-message support on the existing
              String column with no migration — one line behaves exactly as the
              single message did before. */}
          <div className="w-full flex flex-col gap-1.5">
            <label
              htmlFor="announcement-text"
              className="font-body text-sm font-normal tracking-[0.04em] text-brand-text dark:text-brand-neutral-300"
            >
              Mensajes del banner
            </label>
            <textarea
              id="announcement-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder={'Envíos gratis en compras superiores a $200.000\nCompras nacionales mínima de $30.000'}
              className="w-full rounded-md border border-brand-line bg-brand-pearl px-3 py-2 text-base sm:text-sm text-brand-text placeholder:text-brand-text-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:border-brand-gold transition-colors dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
            <p className="text-xs text-brand-neutral-400">
              Un mensaje por línea. Si escribes varios, rotan automáticamente cada
              5 segundos y el visitante puede cambiarlos con las flechas. Las
              cantidades ($30.000) se resaltan solas.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-brand-gold focus:ring-brand-gold size-4 border-brand-neutral-300"
            />
            <span className="text-brand-neutral-700 dark:text-brand-neutral-300">
              Banner activo (visible en el sitio)
            </span>
          </label>

          {error && (
            <div className="rounded bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}
          {savedMsg && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{savedMsg}</p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
