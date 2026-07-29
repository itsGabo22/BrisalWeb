'use client';

import * as React from 'react';
import Image from 'next/image';
import { Upload, Trash2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_FILES = 50;
const CONCURRENCY = 5;

interface BandejaImage {
  id: string;
  url: string;
  filename: string;
  assigned: boolean;
  createdAt: string;
}

interface UploadResult {
  file: File;
  ok: boolean;
  error?: string;
}

async function uploadWithConcurrency(
  files: File[],
  concurrency: number,
  onProgress: (completed: number) => void,
): Promise<UploadResult[]> {
  let cursor = 0;
  let completed = 0;
  const results: UploadResult[] = new Array(files.length);

  async function worker() {
    while (cursor < files.length) {
      const index = cursor++;
      const file = files[index];
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/imagenes/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}) as { error?: string });
          results[index] = { file, ok: false, error: body.error };
        } else {
          results[index] = { file, ok: true };
        }
      } catch {
        results[index] = { file, ok: false, error: 'Error de red' };
      }
      completed += 1;
      onProgress(completed);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

export default function AdminImagenesPage() {
  const [images, setImages] = React.useState<BandejaImage[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadTotal, setUploadTotal] = React.useState(0);
  const [uploadCompleted, setUploadCompleted] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadImages = React.useCallback(async (targetPage: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/imagenes?assigned=false&page=${targetPage}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error loading bandeja:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadImages(page));
  }, [page, loadImages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadError(null);

    if (files.length > MAX_FILES) {
      setUploadError(`Selecciona máximo ${MAX_FILES} imágenes por lote.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadTotal(files.length);
    setUploadCompleted(0);

    const results = await uploadWithConcurrency(files, CONCURRENCY, setUploadCompleted);

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      setUploadError(`${failed.length} de ${files.length} imágenes no se pudieron subir.`);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPage(1);
    void loadImages(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen de la bandeja?')) return;

    try {
      const res = await fetch(`/api/admin/imagenes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
      } else {
        alert('Error al eliminar la imagen');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const progressPercent = uploadTotal > 0 ? Math.round((uploadCompleted / uploadTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Upload section */}
      <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
        <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 flex items-center gap-2">
          <Upload className="size-5 text-brand-gold" />
          <span>Subir imágenes</span>
        </h2>
        <p className="mt-1 font-sans text-xs text-brand-neutral-400">
          Hasta {MAX_FILES} imágenes por lote. Se procesan a WebP (máx. 1200px, calidad 82) antes de subirse.
        </p>

        <label className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-neutral-300 p-8 text-center cursor-pointer hover:border-brand-gold transition-colors dark:border-brand-neutral-700">
          <Upload className="size-6 text-brand-neutral-400" />
          <span className="font-sans text-sm font-semibold text-brand-neutral-600 dark:text-brand-neutral-400">
            Selecciona o arrastra imágenes
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>

        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-neutral-100 dark:bg-brand-neutral-800">
              <div
                className="h-full bg-brand-gold transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="font-sans text-xs text-brand-neutral-500">
              Subiendo {uploadCompleted} de {uploadTotal}…
            </p>
          </div>
        )}

        {uploadError && (
          <p className="mt-3 font-sans text-sm text-red-600" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      {/* Bandeja grid */}
      <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
        <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
          Imágenes en bandeja
        </h2>
        <p className="mt-1 font-sans text-xs text-brand-neutral-400">
          Imágenes disponibles para asignar a productos.
        </p>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-brand-neutral-400 font-sans text-sm">
            <p>No hay imágenes en la bandeja.</p>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-brand-neutral-200 dark:border-brand-neutral-800"
                >
                  <Image
                    src={img.url}
                    alt={img.filename}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-brand-neutral-600 shadow-sm">
                    {img.assigned ? (
                      <>
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        Asignada
                      </>
                    ) : (
                      'Disponible'
                    )}
                  </span>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-red-500/90 p-1.5 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                    aria-label="Eliminar imagen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="size-4" />
                  Anterior
                </Button>
                <span className="font-sans text-sm text-brand-neutral-500">
                  Página {page} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
