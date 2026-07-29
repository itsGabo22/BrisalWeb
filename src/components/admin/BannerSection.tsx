'use client';

import * as React from 'react';
import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        El mensaje que aparece en la franja dorada sobre el encabezado.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-24 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 space-y-4 font-sans text-sm">
          <Input
            label="Texto del banner"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Envíos gratis en compras superiores a $200.000"
          />

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
