'use client';

import * as React from 'react';
import { ImageIcon, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaFrameCard } from '@/components/admin/MediaFrameCard';

interface SiteConfigData {
  wholesaleImageUrl: string | null;
}

const HELPER_TEXT =
  'Usa una foto horizontal y de buena resolución (idealmente 1920px de ancho o más). Se recorta y se amplía un poco para el efecto de profundidad, así que deja aire alrededor del motivo principal.';

export function ParallaxImagesSection() {
  const [config, setConfig] = React.useState<SiteConfigData | null>(null);
  const [wholesaleFile, setWholesaleFile] = React.useState<File | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadConfig = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site-config');
      if (res.ok) setConfig((await res.json()) as SiteConfigData);
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

    // Only the files are sent. The banner fields are deliberately absent so
    // this form cannot overwrite them — the route treats a missing field as
    // "leave it alone".
    const formData = new FormData();
    if (wholesaleFile) formData.append('wholesaleFile', wholesaleFile);

    try {
      const res = await fetch('/api/admin/site-config', { method: 'PATCH', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? 'Error al guardar las imágenes');
      }
      setConfig((await res.json()) as SiteConfigData);
      setWholesaleFile(null);
      setSavedMsg('Guardado correctamente.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Boolean(wholesaleFile);

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 flex items-center gap-2">
        <Images className="size-5 text-brand-gold" />
        <span>Imágenes de fondo</span>
      </h2>
      <p className="mt-1 font-sans text-xs text-brand-neutral-400">
        Fondos con efecto de profundidad: al desplazarse, la imagen se mueve más
        despacio que el texto. Si dejas una sin imagen, esa sección conserva su
        fondo de color actual.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-48 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 space-y-5 font-sans text-sm">
          {/* Labelled with the section's own on-site copy, so there is no
              guessing which upload lands where. */}
          {/* One slot, not two. The «Cada pieza, una historia.» upload was
              removed when that band became video+text — it reads no image, so
              an upload there configured nothing. */}
          <div className="grid gap-5 sm:max-w-md">
            <MediaFrameCard
              label="«¿Tienes un negocio?»"
              sublabel="Sección de mayoristas"
              helperText={HELPER_TEXT}
              aspectClassName="aspect-video"
              icon={ImageIcon}
              kind="image"
              file={wholesaleFile}
              existingUrl={config?.wholesaleImageUrl}
              onChange={setWholesaleFile}
              accept="image/*"
            />
          </div>

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
