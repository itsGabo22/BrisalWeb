'use client';

import * as React from 'react';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SiteConfig {
  lowStockThreshold: number;
}

/**
 * The one storefront number the client tunes rather than the code.
 *
 * Exact stock counts are deliberately hidden from shoppers everywhere on this
 * site; the low-stock nudge is the single exception, where the count IS the
 * message. How low counts as low depends on how fast the client can restock a
 * piece — a merchandising judgement, not an engineering one — so it lives in
 * `SiteConfig` and is edited here.
 *
 * JSON rather than multipart: this panel carries no files, and the site-config
 * route already branches on content type for exactly this case (see
 * `BannerSection`, which does the same).
 */
export function StockThresholdSection() {
  const [config, setConfig] = React.useState<SiteConfig | null>(null);
  const [threshold, setThreshold] = React.useState(3);
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
        setThreshold(data.lowStockThreshold ?? 3);
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
        body: JSON.stringify({ lowStockThreshold: threshold }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? 'Error al guardar el umbral');
      }
      // Re-read rather than trust the local value: the route clamps to 1-99, so
      // what got stored may not be what was typed, and the field must show the
      // stored truth.
      const saved = (await res.json()) as SiteConfig;
      setConfig(saved);
      setThreshold(saved.lowStockThreshold);
      setSavedMsg('Guardado correctamente.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = config !== null && threshold !== config.lowStockThreshold;

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 flex items-center gap-2">
        <PackageSearch className="size-5 text-brand-gold" />
        <span>Aviso de pocas unidades</span>
      </h2>
      <p className="mt-1 font-sans text-xs text-brand-neutral-400">
        El empujón de urgencia que ve el cliente en la página de producto.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-24 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 space-y-4 font-sans text-sm">
          <div className="flex w-full max-w-xs flex-col gap-1.5">
            <label
              htmlFor="low-stock-threshold"
              className="font-body text-sm font-normal tracking-[0.04em] text-brand-text dark:text-brand-neutral-300"
            >
              Umbral de pocas unidades
            </label>
            <input
              id="low-stock-threshold"
              type="number"
              min={1}
              max={99}
              inputMode="numeric"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-28 rounded-md border border-brand-line bg-brand-pearl px-3 py-2 text-base sm:text-sm text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:border-brand-gold transition-colors dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
            <p className="text-xs text-brand-neutral-400">
              Cuando el stock de un color sea igual o menor a este número, se
              mostrará un aviso de «últimas unidades disponibles».
            </p>
            {/* Spelled out because the behaviour above and below the threshold is
                deliberately asymmetric, and the client cannot see that from the
                number alone. */}
            <p className="text-xs text-brand-neutral-400">
              Por encima de ese número no se muestra ninguna cantidad — el
              cliente nunca ve el stock exacto. Ejemplo con {threshold}: un color
              con {threshold} unidades muestra «¡Últimas {threshold}{' '}
              {threshold === 1 ? 'unidad disponible' : 'unidades disponibles'}!»,
              y uno con {threshold + 1} no muestra nada.
            </p>
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}
          {savedMsg && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {savedMsg}
            </p>
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
