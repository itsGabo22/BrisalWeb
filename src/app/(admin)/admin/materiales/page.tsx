'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

/** A material as the admin API returns it — the list needs the usage count. */
interface AdminMaterial {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

/**
 * Mirrors the slugify in the API routes so the preview under the name field
 * matches what the server will actually store.
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminMaterialesPage() {
  const [materials, setMaterials] = React.useState<AdminMaterial[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminMaterial | null>(null);

  const [name, setName] = React.useState('');
  // Empty means "follow the name". Only once the admin edits it does the slug
  // become something the form has to carry on its own.
  const [slug, setSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadMaterials = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/materiales');
      if (res.ok) setMaterials(await res.json());
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadMaterials());
  }, [loadMaterials]);

  const openCreateModal = () => {
    setEditing(null);
    setName('');
    setSlug('');
    setSlugTouched(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (material: AdminMaterial) => {
    setEditing(material);
    setName(material.name);
    setSlug(material.slug);
    setSlugTouched(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const effectiveSlug = slugTouched ? slugify(slug) : slugify(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(
        editing ? `/api/admin/materiales/${editing.id}` : '/api/admin/materiales',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), slug: effectiveSlug }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error al guardar el material');
      }

      await loadMaterials();
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (material: AdminMaterial) => {
    // Cheap local guard so the obvious case never costs a round trip; the
    // server enforces the same rule regardless.
    if (material.productCount > 0) {
      alert(
        `No se puede eliminar «${material.name}» porque ${material.productCount} producto(s) lo usan. Quítalo de esos productos primero.`,
      );
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar el material "${material.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/materiales/${material.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== material.id));
        return;
      }

      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Error al eliminar material');
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Error de conexión al eliminar el material');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-brand-neutral-500">
          Los materiales de cada pieza (Acero, Rodio…). Un producto puede tener varios.
        </p>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="size-4" />
          <span>Nuevo Material</span>
        </Button>
      </div>

      <div className="rounded-xl border border-brand-neutral-200 bg-white overflow-hidden shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          </div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 font-sans text-brand-neutral-500">
            <Gem className="size-6 text-brand-neutral-300" aria-hidden="true" />
            <p className="mt-2 text-lg">No hay materiales registrados.</p>
            <p className="text-sm text-brand-neutral-400">
              Crea el primero para poder asignarlo a tus productos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-brand-neutral-100 dark:border-brand-neutral-800 bg-brand-neutral-50 dark:bg-brand-neutral-950 text-xs font-semibold uppercase tracking-wider text-brand-neutral-500 dark:text-brand-neutral-400">
                  <th className="px-6 py-4">Material</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Productos</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-100 dark:divide-brand-neutral-800">
                {materials.map((material) => (
                  <tr
                    key={material.id}
                    className="hover:bg-brand-neutral-50/50 dark:hover:bg-brand-neutral-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Gem className="size-4 shrink-0 text-brand-gold" aria-hidden="true" />
                        <span className="font-semibold text-brand-neutral-900 dark:text-brand-neutral-100 text-sm">
                          {material.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-neutral-400 dark:text-brand-neutral-500">
                      {material.slug}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center rounded-full bg-brand-neutral-100 px-2 py-1 text-xs font-medium text-brand-neutral-600 dark:bg-brand-neutral-800 dark:text-brand-neutral-300">
                        {material.productCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(material)}
                          className="p-1 text-brand-neutral-500 hover:text-brand-gold transition-colors"
                          aria-label={`Editar ${material.name}`}
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material)}
                          disabled={material.productCount > 0}
                          title={
                            material.productCount > 0
                              ? 'Hay productos que usan este material'
                              : undefined
                          }
                          className="p-1 text-brand-neutral-500 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-brand-neutral-500"
                          aria-label={`Eliminar ${material.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar Material' : 'Nuevo Material'}
        description={
          editing
            ? 'Modifica el nombre o el slug del material.'
            : 'Crea un material para asignarlo a tus productos.'
        }
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="material-form"
              disabled={isSubmitting || name.trim().length < 2}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="material-form" onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
          {formError && (
            <div className="rounded bg-red-50 p-3 text-red-700 text-xs">{formError}</div>
          )}

          <div>
            <label
              htmlFor="material-name"
              className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1"
            >
              Nombre del Material *
            </label>
            <input
              id="material-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Acero, Rodio, Oro laminado..."
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
          </div>

          <div>
            <label
              htmlFor="material-slug"
              className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1"
            >
              Slug
            </label>
            <input
              id="material-slug"
              type="text"
              value={slugTouched ? slug : effectiveSlug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="Se genera a partir del nombre"
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
            <p className="mt-1 text-xs text-brand-neutral-400">
              Se usa en el filtro del catálogo (?material={effectiveSlug || 'acero'}).
            </p>
          </div>

          {editing && editing.productCount > 0 && (
            <p className="rounded bg-amber-50 p-3 text-xs text-amber-700">
              {editing.productCount} producto(s) usan este material. Cambiar el slug
              modificará los enlaces de filtro que ya estén compartidos.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
