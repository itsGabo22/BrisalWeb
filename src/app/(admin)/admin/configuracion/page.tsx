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
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface HeroSlide {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  desktopUrl: string;
  mobileUrl: string | null;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  order: number;
  active: boolean;
}

export default function AdminConfiguracionPage() {
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

  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    <div className="space-y-6">
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
                    <video src={slide.desktopUrl} className="h-full w-full object-cover" muted />
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
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlide ? 'Editar Slide' : 'Agregar Slide'}
        description="Los slides con imagen se procesan automáticamente a WebP."
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
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

          <div>
            <label className="mb-1 block font-medium text-brand-neutral-700 dark:text-brand-neutral-300">
              {type === 'IMAGE' ? 'Imagen de escritorio (1920×1080 sugerido) *' : 'Video (MP4/WebM, máx. 100MB) *'}
            </label>
            <input
              type="file"
              accept={type === 'IMAGE' ? 'image/*' : 'video/mp4,video/webm'}
              onChange={(e) => setDesktopFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs"
            />
            {editingSlide && (
              <p className="mt-1 text-xs text-brand-neutral-400">
                Deja en blanco para conservar el archivo actual.
              </p>
            )}
          </div>

          {type === 'IMAGE' && (
            <div>
              <label className="mb-1 block font-medium text-brand-neutral-700 dark:text-brand-neutral-300">
                Imagen móvil 9:16 (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMobileFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs"
              />
            </div>
          )}

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

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
