'use client';

import * as React from 'react';
import { Ban, Film, ImageIcon, Layers, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MediaFrameCard } from '@/components/admin/MediaFrameCard';
import {
  CENTER,
  MediaFocalPreview,
  clampPercent,
  type FocalPoint,
} from '@/components/admin/MediaFocalPreview';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { cn } from '@/lib/utils';

type BgType = 'NONE' | 'VIDEO' | 'IMAGE';

interface SiteConfigData {
  wholesaleBgType: string;
  wholesaleImageUrl: string | null;
  wholesaleImageUrlMobile: string | null;
  wholesaleVideoUrl: string | null;
  wholesaleVideoUrlMobile: string | null;
  wholesaleBgPosX: number;
  wholesaleBgPosY: number;
  wholesaleBgPosXMobile: number;
  wholesaleBgPosYMobile: number;
}

const VIDEO_HELP =
  'MP4 o WebM, máximo 40MB. Se reproduce en bucle, sin sonido. Un clip corto (15-25s) se ve mejor y carga más rápido.';
const IMAGE_HELP =
  'Foto horizontal de buena resolución (1920px de ancho o más). Se recorta para llenar la sección, así que deja aire alrededor del motivo principal.';
const MOBILE_HELP =
  'Opcional. Si no subes uno, el móvil usa el archivo de escritorio con el encuadre móvil que elijas abajo.';

/**
 * Approximate live shapes of the wholesale band, so the focal preview crops at
 * the ratio the real section crops at. Desktop is a wide strip; on a phone the
 * same copy stacks into something much taller.
 */
const DESKTOP_ASPECT = 'aspect-video';
const MOBILE_ASPECT = 'aspect-[2/3]';

const TYPE_OPTIONS: {
  value: BgType;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'NONE', label: 'Ninguno', hint: 'Degradado de color', icon: Ban },
  { value: 'VIDEO', label: 'Video', hint: 'Clip en bucle', icon: Film },
  { value: 'IMAGE', label: 'Imagen', hint: 'Foto de fondo', icon: ImageIcon },
];

function isBgType(value: string): value is BgType {
  return value === 'NONE' || value === 'VIDEO' || value === 'IMAGE';
}

/**
 * ONE panel for the wholesale band's background.
 *
 * It used to be two: an image lived under «Imágenes de fondo» and a video under
 * «Videos de sección», in different cards, and the public component silently
 * preferred the video. So an admin could upload an image, see no change, and
 * have no way to find out why — nothing anywhere said which asset was winning.
 *
 * The type selector replaces that implicit precedence with an explicit choice.
 * Switching type does NOT delete anything: an uploaded video survives a switch
 * to «Imagen» and comes back intact on switching back, because losing a 40MB
 * upload to a mis-click is a much worse failure than keeping an unused row.
 */
export function WholesaleBackgroundSection() {
  const [config, setConfig] = React.useState<SiteConfigData | null>(null);
  const [bgType, setBgType] = React.useState<BgType>('NONE');

  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoMobileFile, setVideoMobileFile] = React.useState<File | null>(null);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageMobileFile, setImageMobileFile] = React.useState<File | null>(null);

  // Pending removals. Applied on save, so «Quitar» is undoable until then.
  const [clearVideo, setClearVideo] = React.useState(false);
  const [clearImage, setClearImage] = React.useState(false);

  const [desktopFocal, setDesktopFocal] = React.useState<FocalPoint>(CENTER);
  const [mobileFocal, setMobileFocal] = React.useState<FocalPoint>(CENTER);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const applyConfig = React.useCallback((next: SiteConfigData) => {
    setConfig(next);
    setBgType(isBgType(next.wholesaleBgType) ? next.wholesaleBgType : 'NONE');
    setDesktopFocal({
      x: clampPercent(next.wholesaleBgPosX),
      y: clampPercent(next.wholesaleBgPosY),
    });
    setMobileFocal({
      x: clampPercent(next.wholesaleBgPosXMobile),
      y: clampPercent(next.wholesaleBgPosYMobile),
    });
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

  // Local previews of not-yet-uploaded files, revoked on change by the hook.
  const videoObjectUrl = useObjectUrl(videoFile);
  const videoMobileObjectUrl = useObjectUrl(videoMobileFile);
  const imageObjectUrl = useObjectUrl(imageFile);
  const imageMobileObjectUrl = useObjectUrl(imageMobileFile);

  const savedVideoUrl = clearVideo ? null : (config?.wholesaleVideoUrl ?? null);
  const savedVideoMobileUrl = clearVideo ? null : (config?.wholesaleVideoUrlMobile ?? null);
  const savedImageUrl = clearImage ? null : (config?.wholesaleImageUrl ?? null);
  const savedImageMobileUrl = clearImage ? null : (config?.wholesaleImageUrlMobile ?? null);

  const isVideo = bgType === 'VIDEO';
  const kind: 'image' | 'video' = isVideo ? 'video' : 'image';

  // What the focal frames preview: the pending file if there is one, else what
  // is already saved. Mirrors exactly what the site will render after saving.
  const previewDesktopUrl = isVideo
    ? (videoObjectUrl ?? savedVideoUrl)
    : (imageObjectUrl ?? savedImageUrl);
  const ownMobileUrl = isVideo
    ? (videoMobileObjectUrl ?? savedVideoMobileUrl)
    : (imageMobileObjectUrl ?? savedImageMobileUrl);
  // The fallback is the live rule, not a preview convenience: with no mobile
  // asset the band shows the desktop file cropped at the MOBILE focal point.
  const previewMobileUrl = ownMobileUrl ?? previewDesktopUrl;

  const hasVideoAsset = Boolean(savedVideoUrl || videoFile);
  const hasImageAsset = Boolean(savedImageUrl || imageFile);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSavedMsg(null);

    /**
     * Only this band's columns are sent. The video+text section, the banner and
     * the hero are all absent, and the route treats a missing field as "leave
     * it alone" — which is what stops these two forms from overwriting each
     * other now that they both touch SiteConfig.
     */
    const formData = new FormData();
    formData.append('wholesaleBgType', bgType);
    formData.append('wholesaleBgPosX', String(desktopFocal.x));
    formData.append('wholesaleBgPosY', String(desktopFocal.y));
    formData.append('wholesaleBgPosXMobile', String(mobileFocal.x));
    formData.append('wholesaleBgPosYMobile', String(mobileFocal.y));

    if (videoFile) formData.append('wholesaleVideoFile', videoFile);
    if (videoMobileFile) formData.append('wholesaleVideoMobileFile', videoMobileFile);
    if (imageFile) formData.append('wholesaleFile', imageFile);
    if (imageMobileFile) formData.append('wholesaleMobileFile', imageMobileFile);
    if (clearVideo) formData.append('clearWholesaleVideo', 'true');
    if (clearImage) formData.append('clearWholesaleImage', 'true');

    try {
      const res = await fetch('/api/admin/site-config', { method: 'PATCH', body: formData });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(payload.error ?? 'Error al guardar el fondo');
      }
      applyConfig((await res.json()) as SiteConfigData);
      setVideoFile(null);
      setVideoMobileFile(null);
      setImageFile(null);
      setImageMobileFile(null);
      setClearVideo(false);
      setClearImage(false);
      setSavedMsg('Guardado correctamente.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    Boolean(videoFile || videoMobileFile || imageFile || imageMobileFile) ||
    clearVideo ||
    clearImage ||
    bgType !== (config?.wholesaleBgType ?? 'NONE') ||
    desktopFocal.x !== config?.wholesaleBgPosX ||
    desktopFocal.y !== config?.wholesaleBgPosY ||
    mobileFocal.x !== config?.wholesaleBgPosXMobile ||
    mobileFocal.y !== config?.wholesaleBgPosYMobile;

  /**
   * «Quitar» flips the type back to «Ninguno» in the same gesture. Leaving it
   * on VIDEO with no video would render the plain gradient anyway, so the panel
   * would be claiming a state the site isn't in.
   */
  const removeAsset = (target: 'video' | 'image') => {
    if (target === 'video') {
      setClearVideo(true);
      setVideoFile(null);
      setVideoMobileFile(null);
    } else {
      setClearImage(true);
      setImageFile(null);
      setImageMobileFile(null);
    }
    setBgType('NONE');
  };

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
        <Layers className="size-5 text-brand-gold" />
        <span>Fondo — Sección Mayoristas</span>
      </h2>
      <p className="mt-1 font-sans text-xs text-brand-neutral-400">
        La franja «Aumenta tus Ingresos» de la página principal. Elige qué se ve
        detrás del texto: nada, un video o una imagen.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-48 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 space-y-6 font-sans text-sm">
          {/* ── Type selector ─────────────────────────────────────────
              A radiogroup rather than three checkboxes: these are mutually
              exclusive by definition, and only one can be behind the copy. */}
          <div role="radiogroup" aria-label="Tipo de fondo" className="grid gap-3 sm:grid-cols-3">
            {TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = bgType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setBgType(option.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors',
                    selected
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'border-brand-neutral-200 hover:border-brand-neutral-300 dark:border-brand-neutral-800 dark:hover:border-brand-neutral-700',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-5 shrink-0',
                      selected ? 'text-brand-gold' : 'text-brand-neutral-400',
                    )}
                  />
                  <span>
                    <span className="block font-semibold text-brand-neutral-800 dark:text-brand-neutral-100">
                      {option.label}
                    </span>
                    <span className="block text-[11px] text-brand-neutral-400">{option.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {bgType === 'NONE' ? (
            <p className="rounded-lg border border-dashed border-brand-neutral-200 p-4 text-xs text-brand-neutral-400 dark:border-brand-neutral-800">
              La sección usa su degradado de color. Los archivos que hayas subido
              se conservan: vuelve a elegir «Video» o «Imagen» para usarlos.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <MediaFrameCard
                  label={isVideo ? 'Video — escritorio' : 'Imagen — escritorio'}
                  helperText={isVideo ? VIDEO_HELP : IMAGE_HELP}
                  aspectClassName={DESKTOP_ASPECT}
                  icon={isVideo ? Film : ImageIcon}
                  kind={kind}
                  file={isVideo ? videoFile : imageFile}
                  existingUrl={isVideo ? savedVideoUrl : savedImageUrl}
                  onChange={(file) => {
                    if (isVideo) {
                      setVideoFile(file);
                      // A fresh upload cancels a pending removal — otherwise
                      // the save would delete the file just chosen.
                      if (file) setClearVideo(false);
                    } else {
                      setImageFile(file);
                      if (file) setClearImage(false);
                    }
                  }}
                  accept={isVideo ? 'video/mp4,video/webm' : 'image/*'}
                  className="sm:w-3/5"
                />
                <MediaFrameCard
                  label={isVideo ? 'Video — móvil' : 'Imagen — móvil'}
                  sublabel="Opcional"
                  helperText={MOBILE_HELP}
                  aspectClassName={MOBILE_ASPECT}
                  icon={isVideo ? Film : ImageIcon}
                  kind={kind}
                  file={isVideo ? videoMobileFile : imageMobileFile}
                  existingUrl={isVideo ? savedVideoMobileUrl : savedImageMobileUrl}
                  onChange={isVideo ? setVideoMobileFile : setImageMobileFile}
                  accept={isVideo ? 'video/mp4,video/webm' : 'image/*'}
                  className="sm:w-2/5"
                />
              </div>

              {((isVideo && hasVideoAsset) || (!isVideo && hasImageAsset)) && (
                <button
                  type="button"
                  onClick={() => removeAsset(isVideo ? 'video' : 'image')}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="size-3.5" />
                  {isVideo ? 'Quitar video' : 'Quitar imagen'}
                </button>
              )}

              {/* Focal controls — the SAME component the hero slides use, so the
                  drag, the arrow-key nudge and «Restablecer al centro» behave
                  identically in both places. Only the frame ratios differ,
                  because this band is a strip, not a full screen. */}
              <MediaFocalPreview
                kind={kind}
                desktopUrl={previewDesktopUrl}
                mobileUrl={previewMobileUrl}
                mobileIsFallback={!ownMobileUrl}
                desktop={desktopFocal}
                mobile={mobileFocal}
                onDesktopChange={setDesktopFocal}
                onMobileChange={setMobileFocal}
                desktopAspectClassName={DESKTOP_ASPECT}
                mobileAspectClassName={MOBILE_ASPECT}
              />
            </>
          )}

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
