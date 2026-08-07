'use client';

import * as React from 'react';
import NextImage from 'next/image';
import { Palette, Plus, Trash2, ArrowUp, ArrowDown, Upload, X } from 'lucide-react';

/** Matches the brief: roughly seven images per colour. */
export const MAX_VARIANT_IMAGES = 7;

export interface VariantDraft {
  /** Client-side only, for React keys and reordering. Never sent. */
  key: string;
  colorName: string;
  colorHex: string;
  imageUrls: string[];
  /** Kept as text so an empty box stays distinguishable from a zero. */
  price: string;
  wholesalePrice: string;
  stock: number;
}

export function makeVariantDraft(): VariantDraft {
  return {
    key: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    colorName: '',
    colorHex: '#C9A96E',
    imageUrls: [],
    price: '',
    wholesalePrice: '',
    stock: 0,
  };
}

interface BandejaImage {
  id: string;
  url: string;
  filename: string;
}

export interface ColorVariantsSectionProps {
  variants: VariantDraft[];
  onChange: (next: VariantDraft[]) => void;
}

export function ColorVariantsSection({ variants, onChange }: ColorVariantsSectionProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null);
  const [bandejaFor, setBandejaFor] = React.useState<string | null>(null);
  const [bandeja, setBandeja] = React.useState<BandejaImage[]>([]);
  const [loadingBandeja, setLoadingBandeja] = React.useState(false);

  const patch = (key: string, next: Partial<VariantDraft>) => {
    onChange(variants.map((v) => (v.key === key ? { ...v, ...next } : v)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= variants.length) return;
    const next = [...variants];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  /**
   * Uploads through the existing /api/admin/imagenes/upload endpoint, which
   * runs sharp → WebP and wraps the buffer in a Blob before .upload() — the
   * Node 24 undici fix. Nothing here re-implements that path.
   */
  const uploadFiles = async (variant: VariantDraft, files: FileList) => {
    const room = MAX_VARIANT_IMAGES - variant.imageUrls.length;
    if (room <= 0) {
      setError(`Máximo ${MAX_VARIANT_IMAGES} imágenes por color.`);
      return;
    }

    setUploadingKey(variant.key);
    setError(null);
    const uploaded: string[] = [];

    try {
      for (const file of Array.from(files).slice(0, room)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/imagenes/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Error al subir la imagen');
        }
        const data = await res.json();
        uploaded.push(data.url);
      }

      // Read from the live array, not the captured `variant`: several uploads
      // resolve in sequence and the draft may have moved on.
      onChange(
        variants.map((v) =>
          v.key === variant.key
            ? { ...v, imageUrls: [...v.imageUrls, ...uploaded].slice(0, MAX_VARIANT_IMAGES) }
            : v,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploadingKey(null);
    }
  };

  const openBandeja = async (key: string) => {
    setBandejaFor(key);
    setLoadingBandeja(true);
    try {
      const res = await fetch('/api/admin/imagenes?assigned=false&page=1');
      if (res.ok) {
        const data = await res.json();
        setBandeja(data.images ?? data ?? []);
      }
    } catch {
      setError('No se pudo cargar la bandeja de imágenes.');
    } finally {
      setLoadingBandeja(false);
    }
  };

  const assignFromBandeja = (key: string, url: string) => {
    const variant = variants.find((v) => v.key === key);
    if (!variant) return;
    if (variant.imageUrls.includes(url)) return;
    if (variant.imageUrls.length >= MAX_VARIANT_IMAGES) {
      setError(`Máximo ${MAX_VARIANT_IMAGES} imágenes por color.`);
      return;
    }
    patch(key, { imageUrls: [...variant.imageUrls, url] });
  };

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
      <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 mb-1 flex items-center gap-2">
        <Palette className="size-5 text-brand-gold" />
        <span>Colores adicionales (opcional)</span>
      </h2>
      <p className="text-xs text-brand-neutral-400 mb-4">
        Colores <strong>además</strong> del color principal de arriba. Cada uno
        tiene sus propias imágenes y su propio stock. Si el producto solo viene en
        un color, deja esta sección vacía.
      </p>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div
            key={variant.key}
            className="rounded-lg border border-brand-neutral-100 p-4 dark:border-brand-neutral-800"
          >
            <div className="mb-3 flex items-center gap-2">
              <input
                type="color"
                value={variant.colorHex}
                onChange={(e) => patch(variant.key, { colorHex: e.target.value })}
                aria-label="Color"
                className="size-9 shrink-0 cursor-pointer rounded border border-brand-neutral-200 bg-transparent dark:border-brand-neutral-800"
              />
              <input
                type="text"
                value={variant.colorName}
                onChange={(e) => patch(variant.key, { colorName: e.target.value })}
                placeholder="Nombre del color (Ej. Dorado)"
                className="flex-1 rounded border border-brand-neutral-200 bg-white px-3 py-2 text-sm text-brand-neutral-800 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Subir"
                className="p-1.5 text-brand-neutral-400 transition-colors hover:text-brand-gold disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === variants.length - 1}
                aria-label="Bajar"
                className="p-1.5 text-brand-neutral-400 transition-colors hover:text-brand-gold disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(variants.filter((v) => v.key !== variant.key))}
                aria-label="Eliminar color"
                className="p-1.5 text-brand-neutral-400 transition-colors hover:text-red-500"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-brand-neutral-500">
                  Precio (opcional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={variant.price}
                  onChange={(e) => patch(variant.key, { price: e.target.value })}
                  placeholder="Usa el precio general"
                  className="w-full rounded border border-brand-neutral-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950"
                />
                <p className="mt-1 text-[10px] text-brand-neutral-400">
                  Si lo dejas vacío, usa el precio general del producto.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-brand-neutral-500">
                  Precio mayorista (opcional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={variant.wholesalePrice}
                  onChange={(e) => patch(variant.key, { wholesalePrice: e.target.value })}
                  placeholder="Usa el mayorista general"
                  className="w-full rounded border border-brand-neutral-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950"
                />
                <p className="mt-1 text-[10px] text-brand-neutral-400">
                  Si lo dejas vacío, usa el mayorista general.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-brand-neutral-500">
                  Stock de este color
                </label>
                <input
                  type="number"
                  min={0}
                  value={variant.stock}
                  onChange={(e) =>
                    patch(variant.key, { stock: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full rounded border border-brand-neutral-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950"
                />
              </div>
            </div>

            {/* Images for this colour */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-brand-neutral-500">
                  Imágenes ({variant.imageUrls.length}/{MAX_VARIANT_IMAGES})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openBandeja(variant.key)}
                    className="rounded border border-brand-neutral-200 px-2 py-1 text-xs text-brand-neutral-600 transition-colors hover:border-brand-gold hover:text-brand-gold dark:border-brand-neutral-800"
                  >
                    Bandeja
                  </button>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-brand-neutral-200 px-2 py-1 text-xs text-brand-neutral-600 transition-colors hover:border-brand-gold hover:text-brand-gold dark:border-brand-neutral-800">
                    <Upload className="size-3" />
                    {uploadingKey === variant.key ? 'Subiendo…' : 'Subir'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingKey === variant.key}
                      onChange={(e) => {
                        if (e.target.files?.length) void uploadFiles(variant, e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              {variant.imageUrls.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {variant.imageUrls.map((url) => (
                    <div
                      key={url}
                      className="relative size-16 overflow-hidden rounded border border-brand-neutral-200 dark:border-brand-neutral-800"
                    >
                      <NextImage src={url} alt="" fill sizes="64px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          patch(variant.key, {
                            imageUrls: variant.imageUrls.filter((u) => u !== url),
                          })
                        }
                        aria-label="Quitar imagen"
                        className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 text-brand-neutral-600 shadow-sm transition-colors hover:text-red-500"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brand-neutral-400">
                  Aún no hay imágenes para este color.
                </p>
              )}

              {bandejaFor === variant.key && (
                <div className="mt-3 rounded border border-brand-neutral-100 p-3 dark:border-brand-neutral-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-neutral-500">
                      Elegir de la bandeja
                    </span>
                    <button
                      type="button"
                      onClick={() => setBandejaFor(null)}
                      className="text-xs text-brand-neutral-400 hover:text-brand-neutral-700"
                    >
                      Cerrar
                    </button>
                  </div>
                  {loadingBandeja ? (
                    <p className="text-xs text-brand-neutral-400">Cargando…</p>
                  ) : bandeja.length === 0 ? (
                    <p className="text-xs text-brand-neutral-400">
                      No hay imágenes sin asignar en la bandeja.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {bandeja.map((image) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => assignFromBandeja(variant.key, image.url)}
                          className="relative size-14 overflow-hidden rounded border border-brand-neutral-200 transition-colors hover:border-brand-gold dark:border-brand-neutral-800"
                        >
                          <NextImage src={image.url} alt="" fill sizes="56px" className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...variants, makeVariantDraft()])}
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-brand-gold/60 px-3 py-2 text-sm text-brand-gold-deep transition-colors hover:bg-brand-gold/10"
      >
        <Plus className="size-4" />
        Agregar color
      </button>
    </div>
  );
}
