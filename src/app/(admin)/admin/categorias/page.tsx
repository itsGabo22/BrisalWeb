'use client';

import * as React from 'react';
import NextImage from 'next/image';
import { Plus, Edit, Trash2, Folder, ChevronDown, ChevronRight, ImageIcon, X } from 'lucide-react';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  CENTER,
  SingleFocalPreview,
  clampPercent,
  type FocalPoint,
} from '@/components/admin/MediaFocalPreview';
import { useObjectUrl } from '@/hooks/useObjectUrl';

/**
 * Shows the pending upload if there is one, otherwise the stored image,
 * otherwise a placeholder. The object URL for a pending file is revoked on
 * change/unmount so repeatedly re-picking a file doesn't leak blobs.
 */
function CategoryImagePreview({
  file,
  storedUrl,
}: {
  file: File | null;
  storedUrl: string | null;
}) {
  // Derived during render rather than pushed into state from an effect, so the
  // preview is correct on the first paint after a pick. The effect exists only
  // to revoke the previous URL once React has swapped it out.
  const objectUrl = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  React.useEffect(() => {
    if (!objectUrl) return;
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const preview = objectUrl ?? storedUrl;

  return (
    <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg border border-brand-neutral-200 bg-brand-neutral-50 dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      {preview ? (
        // A plain <img> for the pending blob: URL.createObjectURL output is not
        // something next/image can optimize, and the stored URL renders the
        // same way here for consistency.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Vista previa de la categoría" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-brand-neutral-400">
          <ImageIcon className="size-5" aria-hidden="true" />
          <span className="text-[10px]">Sin imagen</span>
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriasPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modal control states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [parentId, setParentId] = React.useState('');
  // Showcase image. Three states matter and they are NOT the same thing:
  //   imageFile set          → a new upload replaces whatever is stored
  //   removeImage true       → explicitly clear the stored image
  //   neither                → leave the stored image completely alone
  // The third case is why the form omits `imageUrl` from the body entirely —
  // see the existing-image fallback in the PATCH route.
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [removeImage, setRemoveImage] = React.useState(false);
  const [imageFocal, setImageFocal] = React.useState<FocalPoint>(CENTER);
  const pendingImageUrl = useObjectUrl(imageFile);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // UI states for tree expansion
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  /** Set when the category list itself could not be fetched. */
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadCategories = React.useCallback(async () => {
    // `if (res.ok)` with no else is what made a failed load invisible: the list
    // stayed empty and nothing said why, so a server error read as "this shop
    // has no categories". A failure now sets an explicit error state.
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/categorias');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoadError('No pudimos cargar las categorías, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retryLoad = React.useCallback(() => {
    setIsLoading(true);
    void loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadCategories());
  }, [loadCategories]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openCreateModal = (parentCatId?: string) => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setParentId(parentCatId || '');
    setImageFile(null);
    setRemoveImage(false);
    setImageFocal(CENTER);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentId(cat.parentId || '');
    setImageFile(null);
    setRemoveImage(false);
    setImageFocal({ x: clampPercent(cat.imagePosX ?? 50), y: clampPercent(cat.imagePosY ?? 50) });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    // Check if category has subcategories
    const hasChildren = categories.some((c) => c.parentId === id);
    if (hasChildren) {
      alert(`La categoría "${name}" contiene subcategorías. Elimínalas primero.`);
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categorias/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        return;
      }

      // Show what the server actually said. The blanket "Error al eliminar
      // categoría" used to hide the one thing worth knowing — which products
      // are still filed here — and left the client guessing.
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Error al eliminar categoría');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error de conexión al eliminar la categoría');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData();
    formData.set('name', name);
    formData.set('description', description.trim());
    formData.set('parentId', parentId);
    formData.set('imagePosX', String(imageFocal.x));
    formData.set('imagePosY', String(imageFocal.y));

    if (imageFile) {
      formData.set('imageFile', imageFile);
    } else if (removeImage) {
      // Empty string is the explicit "clear it" signal; omitting the key
      // entirely is what preserves the stored image.
      formData.set('imageUrl', '');
    }

    try {
      const url = editingCategory ? `/api/admin/categorias/${editingCategory.id}` : '/api/admin/categorias';
      const method = editingCategory ? 'PATCH' : 'POST';

      // No Content-Type header: the browser has to set the multipart boundary.
      const res = await fetch(url, { method, body: formData });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar la categoría');
      }

      await loadCategories();
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build tree structure
  const rootCategories = categories.filter((c) => !c.parentId);
  
  // Helper to render tree nodes recursively
  const renderCategoryRow = (cat: Category, depth = 0) => {
    const children = categories.filter((c) => c.parentId === cat.id);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedIds[cat.id];

    return (
      <div key={cat.id} className="space-y-1">
        <div
          style={{ paddingLeft: `${depth * 24}px` }}
          className="flex items-center justify-between p-3 rounded-lg border border-brand-neutral-100 bg-white hover:bg-brand-neutral-50/50 transition-colors dark:border-brand-neutral-800 dark:bg-brand-neutral-900"
        >
          <div className="flex items-center gap-3 font-sans">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(cat.id)}
                className="text-brand-neutral-500 hover:text-brand-gold transition-colors"
              >
                {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            ) : (
              <div className="size-4" />
            )}

            {cat.imageUrl ? (
              <span className="relative block h-9 w-7 shrink-0 overflow-hidden rounded border border-brand-neutral-200 dark:border-brand-neutral-800">
                <NextImage
                  src={cat.imageUrl}
                  alt=""
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </span>
            ) : (
              <Folder className="size-4 text-brand-gold flex-shrink-0" />
            )}

            <div>
              <span className="font-semibold text-brand-neutral-800 dark:text-brand-neutral-200 text-sm">
                {cat.name}
              </span>
              {cat.description && (
                <span className="hidden sm:inline ml-3 text-xs text-brand-neutral-400">
                  — {cat.description}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!cat.parentId && (
              <button
                onClick={() => openCreateModal(cat.id)}
                className="p-1 text-xs font-semibold text-brand-gold hover:underline mr-2"
              >
                + Subcategoría
              </button>
            )}
            <button
              onClick={() => openEditModal(cat)}
              className="p-1 text-brand-neutral-500 hover:text-brand-gold transition-colors"
              aria-label="Editar categoría"
            >
              <Edit className="size-4" />
            </button>
            <button
              onClick={() => handleDelete(cat.id, cat.name)}
              className="p-1 text-brand-neutral-500 hover:text-red-500 transition-colors"
              aria-label="Eliminar categoría"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1 border-l-2 border-dashed border-brand-neutral-200 dark:border-brand-neutral-800 ml-5 mt-1">
            {children.map((child) => renderCategoryRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-brand-neutral-500">
          Define y administra la estructura del catálogo (Raíz y Subcategorías).
        </p>
        <Button onClick={() => openCreateModal()} className="flex items-center gap-2">
          <Plus className="size-4" />
          <span>Nueva Categoría Raíz</span>
        </Button>
      </div>

      {/* Tree container */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          </div>
        ) : loadError ? (
          /*
            Distinct from the empty state below on purpose. "No hay categorías"
            and "the request failed" look identical to an admin but mean opposite
            things — the first invites creating one, the second means the data is
            there and we could not reach it.
          */
          <div className="flex flex-col items-center justify-center gap-3 h-64 border border-dashed rounded-xl bg-white border-brand-neutral-200 text-brand-neutral-500">
            <p>{loadError}</p>
            <Button variant="secondary" onClick={retryLoad} className="px-5 py-2">
              Reintentar
            </Button>
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-xl bg-white border-brand-neutral-200 text-brand-neutral-400">
            <p>No hay categorías registradas.</p>
          </div>
        ) : (
          rootCategories.map((root) => renderCategoryRow(root))
        )}
      </div>

      {/* Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        description={editingCategory ? 'Modifica los datos de la categoría.' : 'Completa el formulario para crear una categoría.'}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="category-form" disabled={isSubmitting || !name}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
          {formError && (
            <div className="rounded bg-red-50 p-3 text-red-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Anillos, Aretes..."
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
          </div>

          <div>
            <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              rows={3}
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
          </div>

          <div>
            <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
              Categoría Padre (Dejar en blanco para Categoría Principal)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              disabled={!!editingCategory && categories.some((c) => c.parentId === editingCategory.id)}
            >
              <option value="">Categoría Principal (Raíz)</option>
              {categories
                .filter((c) => !c.parentId && (!editingCategory || c.id !== editingCategory.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {editingCategory && categories.some((c) => c.parentId === editingCategory.id) && (
              <p className="text-xs text-brand-neutral-400 mt-1">
                No puedes asignar un padre a una categoría que ya tiene subcategorías.
              </p>
            )}
          </div>

          {/* ── Showcase image ─────────────────────────────────────── */}
          <div>
            <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
              Imagen de la categoría
            </label>
            {/*
              The destination depends on where the category sits, and the copy
              used to claim the portada for both. A subcategory image has never
              appeared there — it now renders as the circular thumbnail in the
              subcategory row of its parent's page, which is a square crop, so
              the 3:4 advice was actively misleading for half the cases.
            */}
            <p className="mb-2 text-xs text-brand-neutral-400">
              {parentId
                ? 'Se muestra como miniatura circular en la fila de subcategorías, dentro de la página de su categoría. Se recorta al centro, así que un encuadre cuadrado funciona mejor.'
                : 'Se muestra en la sección “Categorías” de la portada. Vertical (3:4) da mejor resultado.'}
            </p>

            <div className="flex items-start gap-4">
              <CategoryImagePreview
                file={imageFile}
                storedUrl={removeImage ? null : editingCategory?.imageUrl ?? null}
              />

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) setRemoveImage(false);
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageFile || (editingCategory?.imageUrl && !removeImage)
                    ? 'Cambiar imagen'
                    : 'Subir imagen'}
                </Button>

                {imageFile && (
                  <p className="truncate text-xs text-brand-neutral-500">
                    {imageFile.name}
                  </p>
                )}

                {(imageFile || (editingCategory?.imageUrl && !removeImage)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      // Only an already-STORED image needs the removal flag; a
                      // not-yet-uploaded pick just gets dropped.
                      setRemoveImage(Boolean(editingCategory?.imageUrl));
                    }}
                    className="flex items-center gap-1 text-xs text-brand-neutral-500 transition-colors hover:text-red-500"
                  >
                    <X className="size-3" aria-hidden="true" />
                    Quitar imagen
                  </button>
                )}

                {removeImage && (
                  <p className="text-xs text-amber-600">
                    Se eliminará la imagen actual al guardar.
                  </p>
                )}
              </div>
            </div>

            {/*
              Shape follows destination, per the helper text above: a
              rectangle matching the homepage band for a top-level category,
              a circle matching SubcategoryCircles for a subcategory. Single
              point, not a desktop/mobile pair -- see the schema comment on
              Category.imagePosX for why.
            */}
            {!removeImage && (pendingImageUrl || editingCategory?.imageUrl) && (
              <SingleFocalPreview
                url={pendingImageUrl ?? editingCategory?.imageUrl ?? null}
                kind="image"
                value={imageFocal}
                onChange={setImageFocal}
                shape={parentId ? 'circle' : 'rect'}
                aspectClassName={parentId ? 'aspect-square' : 'aspect-[4/5]'}
                maxWidthClassName={parentId ? 'max-w-[10rem]' : 'max-w-[12rem]'}
              />
            )}
          </div>

        </form>
      </Modal>
    </div>
  );
}
