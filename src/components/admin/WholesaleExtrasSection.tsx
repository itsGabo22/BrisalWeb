'use client';

import * as React from 'react';
import { MessageCircleHeart, PlayCircle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MediaFrameCard } from '@/components/admin/MediaFrameCard';

interface SiteConfigData {
  wholesaleWelcomeMessage: string | null;
  wholesaleInfoVideoUrl: string | null;
}

const VIDEO_HELP =
  'MP4 o WebM, máximo 40MB. Se reproduce en bucle, sin sonido, en la página /mayoristas — NO en el fondo de la portada.';

/** Mirrors the client-side default in WholesaleWelcomeMessage, so the admin
 * panel shows exactly the text a wholesaler will actually see when the field
 * is left blank, rather than an empty box that reads as "nothing configured". */
export const DEFAULT_WHOLESALE_WELCOME_MESSAGE =
  '¡Bienvenido/a! Ya puedes ver los precios mayoristas en todo el catálogo.';

/**
 * Two small, unrelated-but-both-wholesale admin controls sharing one panel
 * rather than each getting its own card for a single field:
 *
 * 1. The welcome message shown once, in-app, on a wholesaler's first login
 *    after approval (WholesaleWelcomeMessage reads this).
 * 2. An optional video for the /mayoristas EXPLAINER page — distinct from
 *    `WholesaleBackgroundSection`'s video, which is the homepage CTA band's
 *    background loop. Labelled explicitly below so the two are never confused
 *    the way "Precio comparativo" and the wholesale price once were.
 */
export function WholesaleExtrasSection() {
  const [config, setConfig] = React.useState<SiteConfigData | null>(null);
  const [message, setMessage] = React.useState('');
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [clearVideo, setClearVideo] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const applyConfig = React.useCallback((next: SiteConfigData) => {
    setConfig(next);
    setMessage(next.wholesaleWelcomeMessage ?? '');
    setClearVideo(false);
  }, []);

  const loadConfig = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site-config');
      if (res.ok) applyConfig((await res.json()) as SiteConfigData);
    } catch (err) {
      console.error('Error loading site config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyConfig]);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadConfig());
  }, [loadConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSavedMsg(null);

    const formData = new FormData();
    formData.append('wholesaleWelcomeMessage', message);
    if (videoFile) formData.append('wholesaleInfoVideoFile', videoFile);
    if (clearVideo) formData.append('clearWholesaleInfoVideo', 'true');

    try {
      const res = await fetch('/api/admin/site-config', { method: 'PATCH', body: formData });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(payload.error ?? 'Error al guardar la sección');
      }
      applyConfig((await res.json()) as SiteConfigData);
      setVideoFile(null);
      setSavedMsg('Guardado correctamente.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const hasExistingVideo = Boolean(config?.wholesaleInfoVideoUrl) && !clearVideo;
  const hasChanges =
    Boolean(videoFile) ||
    clearVideo ||
    message !== (config?.wholesaleWelcomeMessage ?? '');

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
        <MessageCircleHeart className="size-5 text-brand-gold" />
        <span>Programa de mayoristas — bienvenida y video informativo</span>
      </h2>
      <p className="mt-1 font-sans text-xs text-brand-neutral-400">
        Distinto del video de fondo de la portada (panel de arriba): este video
        aparece dentro de la página /mayoristas, no como fondo de una sección.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-32 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 font-sans text-sm md:grid-cols-2">
          <div>
            <label
              htmlFor="wholesale-welcome-message"
              className="mb-1 block font-medium text-brand-neutral-700 dark:text-brand-neutral-300"
            >
              Mensaje de bienvenida mayoristas
            </label>
            <textarea
              id="wholesale-welcome-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={DEFAULT_WHOLESALE_WELCOME_MESSAGE}
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:ring-1 focus:ring-brand-gold focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
            <p className="mt-1 text-[11px] text-brand-neutral-400">
              Este mensaje aparece la primera vez que un mayorista aprobado
              inicia sesión. Si lo dejas vacío, se muestra el texto por defecto
              arriba, en gris.
            </p>
          </div>

          <div className="space-y-2">
            <MediaFrameCard
              label="Video — página «Más información sobre mayoristas»"
              sublabel="/mayoristas — no la portada"
              helperText={VIDEO_HELP}
              aspectClassName="aspect-video"
              icon={PlayCircle}
              kind="video"
              file={videoFile}
              existingUrl={clearVideo ? null : config?.wholesaleInfoVideoUrl}
              onChange={(file) => {
                setVideoFile(file);
                if (file) setClearVideo(false);
              }}
              accept="video/mp4,video/webm"
            />
            {hasExistingVideo && (
              <button
                type="button"
                onClick={() => {
                  setClearVideo(true);
                  setVideoFile(null);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="size-3.5" />
                Quitar video
              </button>
            )}
            <p className="text-[11px] text-brand-neutral-400">
              Opcional. Si no subes uno, la página se ve exactamente como hoy —
              sin espacio vacío ni marcador de posición.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}
      {savedMsg && (
        <p className="mt-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {savedMsg}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
