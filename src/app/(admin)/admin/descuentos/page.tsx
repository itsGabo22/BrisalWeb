'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, Tag, Percent } from 'lucide-react';
import type { Discount, Category, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export default function AdminDescuentosPage() {
  const [discounts, setDiscounts] = React.useState<Discount[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<Discount | null>(null);

  // Form states
  const [label, setLabel] = React.useState('');
  const [percentage, setPercentage] = React.useState<number>(0);
  const [scope, setScope] = React.useState<'GLOBAL' | 'CATEGORY' | 'PRODUCT'>('GLOBAL');
  const [categoryId, setCategoryId] = React.useState('');
  const [productId, setProductId] = React.useState('');
  const [couponCode, setCouponCode] = React.useState('');
  const [active, setActive] = React.useState(true);
  
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const [resDiscs, resCats, resProds] = await Promise.all([
        fetch('/api/admin/descuentos'),
        fetch('/api/admin/categorias'),
        fetch('/api/admin/productos'),
      ]);

      if (resDiscs.ok && resCats.ok && resProds.ok) {
        const discs = await resDiscs.json();
        const cats = await resCats.json();
        const prods = await resProds.json();
        setDiscounts(discs);
        setCategories(cats);
        setProducts(prods);
      }
    } catch (error) {
      console.error('Error loading discounts data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setLabel('');
    setPercentage(10);
    setScope('GLOBAL');
    setCategoryId('');
    setProductId('');
    setCouponCode('');
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setLabel(d.label || '');
    setPercentage(d.percentage);
    setScope(d.scope);
    setCategoryId(d.categoryId || '');
    setProductId(d.productId || '');
    setCouponCode(d.couponCode || '');
    setActive(d.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la campaña de descuento "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/descuentos/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDiscounts((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert('Error al eliminar descuento');
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
    }
  };

  const toggleActiveStatus = async (d: Discount) => {
    try {
      const res = await fetch(`/api/admin/descuentos/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !d.active }),
      });

      if (res.ok) {
        setDiscounts((prev) =>
          prev.map((item) => (item.id === d.id ? { ...item, active: !d.active } : item))
        );
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      label: label.trim(),
      percentage: Number(percentage),
      scope,
      categoryId: scope === 'CATEGORY' ? categoryId : null,
      productId: scope === 'PRODUCT' ? productId : null,
      couponCode: couponCode.trim() || null,
      active,
    };

    try {
      const url = editingDiscount ? `/api/admin/descuentos/${editingDiscount.id}` : '/api/admin/descuentos';
      const method = editingDiscount ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar descuento');
      }

      await loadData();
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top section */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-brand-neutral-500">
          Crea y administra promociones, cupones globales o descuentos sobre categorías y productos específicos.
        </p>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="size-4" />
          <span>Crear Descuento</span>
        </Button>
      </div>

      {/* Grid List */}
      <div className="rounded-xl border border-brand-neutral-200 bg-white overflow-hidden shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 font-sans text-brand-neutral-400">
            <p>No hay descuentos creados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-brand-neutral-100 dark:border-brand-neutral-800 bg-brand-neutral-50 dark:bg-brand-neutral-950 text-xs font-semibold uppercase tracking-wider text-brand-neutral-500 dark:text-brand-neutral-400">
                  <th className="px-6 py-4">Campaña</th>
                  <th className="px-6 py-4">Porcentaje</th>
                  <th className="px-6 py-4">Alcance (Scope)</th>
                  <th className="px-6 py-4">Cupón</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-100 dark:divide-brand-neutral-800">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-brand-neutral-50/50 dark:hover:bg-brand-neutral-800/20 transition-colors">
                    {/* Label */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="size-4 text-brand-gold" />
                        <span className="font-semibold text-brand-neutral-800 dark:text-brand-neutral-250 text-sm">
                          {discount.label || 'Descuento Sin Nombre'}
                        </span>
                      </div>
                    </td>

                    {/* Percentage */}
                    <td className="px-6 py-4 text-sm font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
                      <span className="flex items-center gap-1">
                        <Percent className="size-3 text-brand-gold" />
                        {discount.percentage}% OFF
                      </span>
                    </td>

                    {/* Scope */}
                    <td className="px-6 py-4 text-sm text-brand-neutral-600 dark:text-brand-neutral-400">
                      <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-brand-neutral-100 dark:bg-brand-neutral-950 text-brand-neutral-500">
                        {discount.scope}
                      </span>
                      {discount.scope === 'CATEGORY' && (
                        <span className="block text-xs text-brand-neutral-400">
                          Cat: {categories.find((c) => c.id === discount.categoryId)?.name || 'Desconocida'}
                        </span>
                      )}
                      {discount.scope === 'PRODUCT' && (
                        <span className="block text-xs text-brand-neutral-400">
                          Prod: {products.find((p) => p.id === discount.productId)?.name || 'Desconocido'}
                        </span>
                      )}
                    </td>

                    {/* Coupon */}
                    <td className="px-6 py-4 text-sm font-mono text-brand-neutral-500">
                      {discount.couponCode ? (
                        <span className="border border-dashed border-brand-neutral-300 rounded px-2 py-0.5 bg-brand-neutral-50 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 text-brand-neutral-700 dark:text-brand-neutral-300">
                          {discount.couponCode}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* State Toggle */}
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => toggleActiveStatus(discount)}
                        className="flex items-center gap-2 text-left"
                      >
                        {discount.active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-emerald-950/30 dark:text-emerald-400">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-brand-neutral-500 bg-brand-neutral-100 px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-brand-neutral-950 dark:text-brand-neutral-400">
                            Inactivo
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(discount)}
                          className="p-1 text-brand-neutral-500 hover:text-brand-gold transition-colors"
                          aria-label="Editar descuento"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id, discount.label || '')}
                          className="p-1 text-brand-neutral-500 hover:text-red-500 transition-colors"
                          aria-label="Eliminar descuento"
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

      {/* Modal Editor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? 'Editar Descuento' : 'Nuevo Descuento'}
        description={editingDiscount ? 'Modifica los valores del descuento.' : 'Crea una nueva campaña promocional.'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
          {formError && (
            <div className="rounded bg-red-50 p-3 text-red-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
              Nombre de la Campaña *
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Black Friday, Descuento Aretes..."
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Porcentaje (%) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
            </div>

            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Código Cupón (Opcional)
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Ej. PROMO20"
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
              Alcance de la Campaña *
            </label>
            <select
              value={scope}
              onChange={(e) =>
                setScope(e.target.value as Discount['scope'])
              }
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            >
              <option value="GLOBAL">Global (Aplica a todo el catálogo)</option>
              <option value="CATEGORY">Por Categoría</option>
              <option value="PRODUCT">Por Producto Específico</option>
            </select>
          </div>

          {/* Conditional dropdown based on Scope */}
          {scope === 'CATEGORY' && (
            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Seleccionar Categoría *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'PRODUCT' && (
            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Seleccionar Producto *
              </label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              >
                <option value="">Selecciona un producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-brand-gold focus:ring-brand-gold size-4 border-brand-neutral-300"
            />
            <label htmlFor="active" className="text-sm text-brand-neutral-700 dark:text-brand-neutral-300">
              Descuento activo
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !label}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
