'use client';

import * as React from 'react';
import { Gift, ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaFrameCard } from '@/components/admin/MediaFrameCard';
import {
  CENTER,
  SingleFocalPreview,
  clampPercent,
  type FocalPoint,
} from '@/components/admin/MediaFocalPreview';
import { useObjectUrl } from '@/hooks/useObjectUrl';

interface PromoPopupData {
  id: string;
  active: boolean;
  imageUrl: string | null;
  imagePosX: number;
  imagePosY: number;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  showOnce: boolean;
}

export function PromoPopupSection() {
  const [popup, setPopup] = React.useState<PromoPopupData | null>(null);
  const [active, setActive] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [subtitle, setSubtitle] = React.useState('');
  const [ctaText, setCtaText] = React.useState('');
  const [ctaHref, setCtaHref] = React.useState('');
  const [showOnce, setShowOnce] = React.useState(true);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [focal, setFocal] = React.useState<FocalPoint>(CENTER);
  /** Staged, not immediate -- matches the wholesale-background and
   * /mayoristas-video "Quitar" pattern: nothing is actually removed until
   * "Guardar cambios" is clicked, so the admin can back out of a clear by
   * reloading instead of needing a confirm() dialog. */
  const [clearImage, setClearImage] = React.useState(false);
  const pendingImageUrl = useObjectUrl(imageFile);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadPopup = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/promo-popup');
      if (res.ok) {
        const data = (await res.json()) as PromoPopupData;
        setPopup(data);
        setActive(data.active);
        setTitle(data.title ?? '');
        setSubtitle(data.subtitle ?? '');
        setCtaText(data.ctaText ?? '');
        setCtaHref(data.ctaHref ?? '');
        setShowOnce(data.showOnce);
        setFocal({ x: clampPercent(data.imagePosX), y: clampPercent(data.imagePosY) });
        setClearImage(false);
      }
    } catch (err) {
      console.error('Error loading promo popup:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadPopup());
  }, [loadPopup]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSavedMsg(null);

    const formData = new FormData();
    formData.append('active', String(active));
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('ctaText', ctaText);
    formData.append('ctaHref', ctaHref);
    formData.append('showOnce', String(showOnce));
    formData.append('imagePosX', String(focal.x));
    formData.append('imagePosY', String(focal.y));
    if (imageFile) {
      formData.append('imageFile', imageFile);
    } else if (clearImage) {
      formData.append('clearImage', 'true');
    }

    try {
      const res = await fetch('/api/admin/promo-popup', { method: 'PATCH', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? 'Error al guardar el popup');
      }
      const updated = (await res.json()) as PromoPopupData;
      setPopup(updated);
      setImageFile(null);
      setClearImage(false);
      setFocal({ x: clampPercent(updated.imagePosX), y: clampPercent(updated.imagePosY) });
      setSavedMsg('Guardado correctamente.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 flex items-center gap-2">
        <Gift className="size-5 text-brand-gold" />
        <span>Popup promocional</span>
      </h2>
      <p className="mt-1 font-sans text-xs text-brand-neutral-400">
        Aparece 1.5s después de cargar la página de inicio.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-48 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 space-y-5 font-sans text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-brand-gold focus:ring-brand-gold size-4 border-brand-neutral-300"
            />
            <span className="text-brand-neutral-700 dark:text-brand-neutral-300">
              Popup activo
            </span>
          </label>

          <div className="space-y-2">
            <MediaFrameCard
              label="Imagen (opcional)"
              aspectClassName="aspect-[4/3]"
              icon={ImageIcon}
              kind="image"
              file={imageFile}
              existingUrl={clearImage ? null : popup?.imageUrl}
              onChange={(file) => {
                setImageFile(file);
                if (file) setClearImage(false);
              }}
              accept="image/*"
              className="max-w-xs"
            />
            {!clearImage && !imageFile && popup?.imageUrl && (
              <button
                type="button"
                onClick={() => setClearImage(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="size-3.5" />
                Quitar imagen
              </button>
            )}
          </div>

          {!clearImage && (pendingImageUrl || popup?.imageUrl) && (
            <SingleFocalPreview
              url={pendingImageUrl ?? popup?.imageUrl ?? null}
              kind="image"
              value={focal}
              onChange={setFocal}
              aspectClassName="aspect-[4/3]"
              maxWidthClassName="max-w-xs"
            />
          )}

          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¡Oferta especial!"
          />

          <Input
            label="Subtítulo"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="20% de descuento en toda la colección"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Texto del CTA"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Ver oferta"
            />
            <Input
              label="Link del CTA"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="/catalogo"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnce}
              onChange={(e) => setShowOnce(e.target.checked)}
              className="rounded text-brand-gold focus:ring-brand-gold size-4 border-brand-neutral-300"
            />
            <span className="text-brand-neutral-700 dark:text-brand-neutral-300">
              Mostrar solo una vez por visitante
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
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
