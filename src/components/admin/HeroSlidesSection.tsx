'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Video,
  Monitor,
  Smartphone,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { MediaFrameCard } from '@/components/admin/MediaFrameCard';
import {
  CENTER,
  HeroFocalPreview,
  type FocalPoint,
} from '@/components/admin/HeroFocalPreview';
import { useObjectUrl } from '@/hooks/useObjectUrl';

interface HeroSlide {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  desktopUrl: string;
  mobileUrl: string | null;
  posterUrl: string | null;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  order: number;
  active: boolean;
  desktopPosX: number;
  desktopPosY: number;
  mobilePosX: number;
  mobilePosY: number;
}

export function HeroSlidesSection() {
  const [slides, setSlides] = React.useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSlide, setEditingSlide] = React.useState<HeroSlide | null>(null);

  const [type, setType] = React.useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [title, setTitle] = React.useState('');
  const [subtitle, setSubtitle] = React.useState('');
  const [ctaText, setCtaText] = React.useState('');
  const [ctaHref, setCtaHref] = React.useState('');
  const [desktopFile, setDesktopFile] = React.useState<File | null>(null);
  const [mobileFile, setMobileFile] = React.useState<File | null>(null);
  const [posterFile, setPosterFile] = React.useState<File | null>(null);
  const [desktopFocal, setDesktopFocal] = React.useState<FocalPoint>(CENTER);
  const [mobileFocal, setMobileFocal] = React.useState<FocalPoint>(CENTER);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  /**
   * Preview URLs for files that are picked but not yet uploaded, so the focal
   * frames show the NEW media the moment it's chosen rather than the old one
   * it is about to replace.
   */
  const desktopObjectUrl = useObjectUrl(desktopFile);
  const mobileObjectUrl = useObjectUrl(mobileFile);
  const posterObjectUrl = useObjectUrl(posterFile);

  const previewKind = type === 'VIDEO' ? 'video' : 'image';
  const previewPosterUrl = posterObjectUrl ?? editingSlide?.posterUrl ?? null;
  const previewDesktopUrl = desktopObjectUrl ?? editingSlide?.desktopUrl ?? null;
  /**
   * A VIDEO slide has no separate mobile file at all, and an IMAGE slide's
   * mobile upload is optional — both cases fall back to the desktop media,
   * which is exactly what the live hero renders below the breakpoint.
   */
  const ownMobileUrl =
    type === 'VIDEO' ? null : (mobileObjectUrl ?? editingSlide?.mobileUrl ?? null);
  const previewMobileUrl = ownMobileUrl ?? previewDesktopUrl;

  const loadSlides = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/hero-slides');
      if (res.ok) {
        setSlides(await res.json());
      }
    } catch (error) {
      console.error('Error loading hero slides:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadSlides());
  }, [loadSlides]);

  const openCreateModal = () => {
    setEditingSlide(null);
    setType('IMAGE');
    setTitle('');
    setSubtitle('');
    setCtaText('');
    setCtaHref('');
    setDesktopFile(null);
    setMobileFile(null);
    setPosterFile(null);
    setDesktopFocal(CENTER);
    setMobileFocal(CENTER);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setType(slide.type);
    setTitle(slide.title ?? '');
    setSubtitle(slide.subtitle ?? '');
    setCtaText(slide.ctaText ?? '');
    setCtaHref(slide.ctaHref ?? '');
    setDesktopFile(null);
    setMobileFile(null);
    setPosterFile(null);
    // Slides saved before focal points existed come back as 50/50 from the
    // column default, so `?? 50` is only a guard against a partial payload.
    setDesktopFocal({ x: slide.desktopPosX ?? 50, y: slide.desktopPosY ?? 50 });
    setMobileFocal({ x: slide.mobilePosX ?? 50, y: slide.mobilePosY ?? 50 });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este slide del hero?')) return;

    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSlides((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert('Error al eliminar el slide');
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      const formData = new FormData();
      formData.append('active', String(!slide.active));
      const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
        method: 'PATCH',
        body: formData,
      });
      if (res.ok) {
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, active: !slide.active } : s)),
        );
      }
    } catch (error) {
      console.error('Error toggling slide:', error);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const current = slides[index];
    const target = slides[targetIndex];

    try {
      await Promise.all([
        (async () => {
          const fd = new FormData();
          fd.append('order', String(target.order));
          await fetch(`/api/admin/hero-slides/${current.id}`, { method: 'PATCH', body: fd });
        })(),
        (async () => {
          const fd = new FormData();
          fd.append('order', String(current.order));
          await fetch(`/api/admin/hero-slides/${target.id}`, { method: 'PATCH', body: fd });
        })(),
      ]);
      void loadSlides();
    } catch (error) {
      console.error('Error reordering slides:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingSlide && !desktopFile) {
      setFormError('Debes subir un archivo principal');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    if (!editingSlide) formData.append('type', type);
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('ctaText', ctaText);
    formData.append('ctaHref', ctaHref);
    if (desktopFile) formData.append('desktopFile', desktopFile);
    if (mobileFile) formData.append('mobileFile', mobileFile);
    if (posterFile) formData.append('posterFile', posterFile);
    formData.append('desktopPosX', String(desktopFocal.x));
    formData.append('desktopPosY', String(desktopFocal.y));
    formData.append('mobilePosX', String(mobileFocal.x));
    formData.append('mobilePosY', String(mobileFocal.y));

    try {
      const url = editingSlide
        ? `/api/admin/hero-slides/${editingSlide.id}`
        : '/api/admin/hero-slides';
      const method = editingSlide ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar el slide');
      }

      await loadSlides();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
            Slides del Hero
          </h2>
          <p className="mt-1 font-sans text-xs text-brand-neutral-400">
            Administra el carrusel de imágenes/video de la portada.
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="size-4" />
          <span>Agregar slide</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : slides.length === 0 ? (
        <div className="mt-6 flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-brand-neutral-200 text-brand-neutral-400 font-sans text-sm dark:border-brand-neutral-800">
          <p>No hay slides configurados. Se mostrará el diseño por defecto.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex items-center gap-4 rounded-lg border border-brand-neutral-100 bg-white p-3 dark:border-brand-neutral-800 dark:bg-brand-neutral-950"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-brand-neutral-200 bg-brand-neutral-50 dark:border-brand-neutral-800">
                {slide.type === 'IMAGE' ? (
                  <Image src={slide.desktopUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <video
                    src={slide.desktopUrl}
                    poster={slide.posterUrl ?? undefined}
                    className="h-full w-full object-cover"
                    muted
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 font-sans text-sm">
                <div className="flex items-center gap-2">
                  {slide.type === 'IMAGE' ? (
                    <ImageIcon className="size-3.5 text-brand-gold" />
                  ) : (
                    <Video className="size-3.5 text-brand-gold" />
                  )}
                  <span className="font-semibold text-brand-neutral-800 dark:text-brand-neutral-200 truncate">
                    {slide.title || 'Sin título (usa copy por defecto)'}
                  </span>
                </div>
                {slide.subtitle && (
                  <p className="mt-0.5 truncate text-xs text-brand-neutral-400">{slide.subtitle}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleToggleActive(slide)}
                className="shrink-0"
                aria-label={slide.active ? 'Desactivar slide' : 'Activar slide'}
              >
                {slide.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-neutral-100 px-2 py-0.5 text-xs font-medium text-brand-neutral-500 dark:bg-brand-neutral-900 dark:text-brand-neutral-400">
                    <XCircle className="size-3" />
                    Inactivo
                  </span>
                )}
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleReorder(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-brand-neutral-500 hover:text-brand-gold disabled:opacity-30 transition-colors"
                  aria-label="Mover arriba"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(index, 'down')}
                  disabled={index === slides.length - 1}
                  className="p-1 text-brand-neutral-500 hover:text-brand-gold disabled:opacity-30 transition-colors"
                  aria-label="Mover abajo"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(slide)}
                  className="p-1 text-brand-neutral-500 hover:text-brand-gold transition-colors"
                  aria-label="Editar slide"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(slide.id)}
                  className="p-1 text-brand-neutral-500 hover:text-red-500 transition-colors"
                  aria-label="Eliminar slide"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlide ? 'Editar Slide' : 'Agregar Slide'}
        description="Los slides con imagen se procesan automáticamente a WebP."
        className="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="hero-slide-form" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="hero-slide-form" onSubmit={handleSubmit} className="space-y-5 font-sans text-sm">
          {formError && (
            <div className="rounded bg-red-50 p-3 text-red-700 text-xs">{formError}</div>
          )}

          {!editingSlide && (
            <div>
              <label className="mb-1 block font-medium text-brand-neutral-700 dark:text-brand-neutral-300">
                Tipo de slide
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    checked={type === 'IMAGE'}
                    onChange={() => setType('IMAGE')}
                    className="text-brand-gold focus:ring-brand-gold"
                  />
                  Imagen
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    checked={type === 'VIDEO'}
                    onChange={() => setType('VIDEO')}
                    className="text-brand-gold focus:ring-brand-gold"
                  />
                  Video
                </label>
              </div>
            </div>
          )}

          {type === 'IMAGE' ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <MediaFrameCard
                label="Desktop (1920×1080)"
                aspectClassName="aspect-video"
                icon={Monitor}
                kind="image"
                file={desktopFile}
                existingUrl={editingSlide?.desktopUrl}
                onChange={setDesktopFile}
                accept="image/*"
                helperText={editingSlide ? 'Deja en blanco para conservar la actual.' : undefined}
                className="sm:w-3/5"
              />
              <MediaFrameCard
                label="Mobile (1080×1920)"
                sublabel="(Opcional, usa la de escritorio si no se sube)"
                aspectClassName="aspect-[9/16]"
                icon={Smartphone}
                kind="image"
                file={mobileFile}
                existingUrl={editingSlide?.mobileUrl}
                onChange={setMobileFile}
                accept="image/*"
                className="sm:w-2/5"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <MediaFrameCard
                label="Video (MP4/WebM, máx. 100MB)"
                aspectClassName="aspect-video"
                icon={Video}
                kind="video"
                file={desktopFile}
                existingUrl={editingSlide?.desktopUrl}
                onChange={setDesktopFile}
                accept="video/mp4,video/webm"
                helperText={editingSlide ? 'Deja en blanco para conservar el actual.' : undefined}
                className="sm:w-3/5"
              />
              <MediaFrameCard
                label="Miniatura (poster)"
                sublabel="Opcional"
                aspectClassName="aspect-square"
                icon={ImageIcon}
                kind="image"
                file={posterFile}
                existingUrl={editingSlide?.posterUrl}
                onChange={setPosterFile}
                accept="image/*"
                className="sm:w-2/5"
              />
            </div>
          )}

          {/* Sits directly under the upload cards: the admin picks a file, then
              immediately sees and adjusts how it will be cropped, without
              having to save and go look at the homepage. */}
          <HeroFocalPreview
            kind={previewKind}
            desktopUrl={previewDesktopUrl}
            mobileUrl={previewMobileUrl}
            posterUrl={previewPosterUrl}
            mobileIsFallback={!ownMobileUrl}
            desktop={desktopFocal}
            mobile={mobileFocal}
            onDesktopChange={setDesktopFocal}
            onMobileChange={setMobileFocal}
          />

          <Input
            label="Título (opcional — sobrescribe el copy por defecto)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="BRISAL"
          />

          <Input
            label="Subtítulo (opcional)"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="by Salvador"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Texto del CTA (opcional)"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Explorar Colección"
            />
            <Input
              label="Link del CTA (opcional)"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="/catalogo"
            />
          </div>

        </form>
      </Modal>
    </div>
  );
}
