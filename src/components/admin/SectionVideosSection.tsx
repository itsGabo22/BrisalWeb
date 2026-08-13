'use client';

import * as React from 'react';
import { Clapperboard, Film } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MediaFrameCard } from '@/components/admin/MediaFrameCard';

interface SiteConfigData {
  videoSectionTitle: string | null;
  videoSectionBody: string | null;
  videoSectionVideoUrl: string | null;
  videoSectionLinkUrl: string | null;
  wholesaleVideoUrl: string | null;
}

const VIDEO_HELP =
  'MP4 o WebM, máximo 40MB. Se reproduce en bucle, sin sonido. Un clip corto (15-25s) se ve mejor y carga más rápido.';

export function SectionVideosSection() {
  const [config, setConfig] = React.useState<SiteConfigData | null>(null);
  const [videoSectionFile, setVideoSectionFile] = React.useState<File | null>(null);
  const [wholesaleVideoFile, setWholesaleVideoFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [linkUrl, setLinkUrl] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const applyConfig = React.useCallback((next: SiteConfigData) => {
    setConfig(next);
    setTitle(next.videoSectionTitle ?? '');
    setBody(next.videoSectionBody ?? '');
    setLinkUrl(next.videoSectionLinkUrl ?? '');
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

    /**
     * Only what this form owns is sent. Every other column — the banner, the
     * parallax backdrops — is simply absent, and the route treats a missing
     * field as "leave it alone". That is what stops saving a title here from
     * wiping a video uploaded a moment ago, and vice versa.
     */
    const formData = new FormData();
    formData.append('videoSectionTitle', title);
    formData.append('videoSectionBody', body);
    formData.append('videoSectionLinkUrl', linkUrl);
    if (videoSectionFile) formData.append('videoSectionFile', videoSectionFile);
    if (wholesaleVideoFile) formData.append('wholesaleVideoFile', wholesaleVideoFile);

    try {
      const res = await fetch('/api/admin/site-config', { method: 'PATCH', body: formData });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(payload.error ?? 'Error al guardar la sección');
      }
      applyConfig((await res.json()) as SiteConfigData);
      setVideoSectionFile(null);
      setWholesaleVideoFile(null);
      setSavedMsg('Guardado correctamente.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    Boolean(videoSectionFile || wholesaleVideoFile) ||
    title !== (config?.videoSectionTitle ?? '') ||
    body !== (config?.videoSectionBody ?? '') ||
    linkUrl !== (config?.videoSectionLinkUrl ?? '');

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
        <Clapperboard className="size-5 text-brand-gold" />
        <span>Videos de sección</span>
      </h2>
      <p className="mt-1 font-sans text-xs text-brand-neutral-400">
        Los videos se reproducen automáticamente, en bucle y sin sonido. Si dejas
        una sección sin video, conserva su diseño actual — no se ve rota.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-48 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 space-y-6 font-sans text-sm">
          <div className="grid gap-6 md:grid-cols-2">
            {/* ── Video + texto ─────────────────────────────────────── */}
            <div className="space-y-4">
              <MediaFrameCard
                label="Sección video + texto"
                sublabel="Reemplaza «Cada pieza, una historia.»"
                helperText={VIDEO_HELP}
                // Square, because that is the frame it renders in on the site.
                aspectClassName="aspect-square"
                icon={Film}
                kind="video"
                file={videoSectionFile}
                existingUrl={config?.videoSectionVideoUrl}
                onChange={setVideoSectionFile}
                accept="video/mp4,video/webm"
              />

              <div>
                <label
                  htmlFor="video-section-title"
                  className="mb-1 block font-medium text-brand-neutral-700 dark:text-brand-neutral-300"
                >
                  Título
                </label>
                <input
                  id="video-section-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Cada pieza, una historia."
                  className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:ring-1 focus:ring-brand-gold focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
                />
              </div>

              <div>
                <label
                  htmlFor="video-section-body"
                  className="mb-1 block font-medium text-brand-neutral-700 dark:text-brand-neutral-300"
                >
                  Texto
                </label>
                <textarea
                  id="video-section-body"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Accesorios en acero y rodio diseñados para acompañar cada momento especial."
                  className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:ring-1 focus:ring-brand-gold focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
                />
                <p className="mt-1 text-[11px] text-brand-neutral-400">
                  Si dejas estos campos vacíos, se muestran los textos por defecto.
                </p>
              </div>

              <div>
                <label
                  htmlFor="video-section-link"
                  className="mb-1 block font-medium text-brand-neutral-700 dark:text-brand-neutral-300"
                >
                  Enlace de la sección (opcional)
                </label>
                <input
                  id="video-section-link"
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/catalogo/aretes"
                  className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 font-mono text-brand-neutral-850 focus:ring-1 focus:ring-brand-gold focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
                />
                <p className="mt-1 text-[11px] text-brand-neutral-400">
                  Ruta interna del sitio. Ejemplos:{' '}
                  <code className="text-brand-neutral-500">/catalogo</code>,{' '}
                  <code className="text-brand-neutral-500">/catalogo/aretes</code>,{' '}
                  <code className="text-brand-neutral-500">/catalogo?tag=nuevo</code>.
                  Si lo dejas vacío, la sección no será clicable.
                </p>
              </div>
            </div>

            {/* ── Mayoristas ────────────────────────────────────────── */}
            <div className="space-y-4">
              <MediaFrameCard
                label="Sección de mayoristas"
                sublabel="Video de fondo (opcional)"
                helperText={VIDEO_HELP}
                aspectClassName="aspect-video"
                icon={Film}
                kind="video"
                file={wholesaleVideoFile}
                existingUrl={config?.wholesaleVideoUrl}
                onChange={setWholesaleVideoFile}
                accept="video/mp4,video/webm"
              />
              <p className="text-[11px] text-brand-neutral-400">
                El video tiene prioridad sobre la imagen de fondo de esa sección.
                Si no subes ninguno, se usa la imagen (o el degradado) actual.
              </p>
            </div>
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
