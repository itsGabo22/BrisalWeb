'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

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
  
  // UI states for tree expansion
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadCategories = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categorias');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentId(cat.parentId || '');
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
      } else {
        alert('Error al eliminar categoría');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name,
      description: description.trim() || null,
      parentId: parentId || null,
      imageUrl: null,
    };

    try {
      const url = editingCategory ? `/api/admin/categorias/${editingCategory.id}` : '/api/admin/categorias';
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

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

            <Folder className="size-4 text-brand-gold flex-shrink-0" />
            
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
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
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

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !name}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
