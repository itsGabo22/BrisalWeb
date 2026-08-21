'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, Tag, Percent, RefreshCw } from 'lucide-react';
import type { Discount, DiscountAudience, Category, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { DiscountProductPicker } from '@/components/admin/DiscountProductPicker';
import {
  fromDateInput,
  getDiscountState,
  STATE_BADGE,
  STATE_LABEL,
  toDateInput,
} from '@/lib/utils/discount-status';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatRange(startsAt?: string | null, endsAt?: string | null): string {
  const from = startsAt ? DATE_FORMATTER.format(new Date(startsAt)) : null;
  const to = endsAt ? DATE_FORMATTER.format(new Date(endsAt)) : null;
  if (!from && !to) return 'Sin límite';
  if (from && to) return `${from} — ${to}`;
  return from ? `Desde ${from}` : `Hasta ${to}`;
}

export default function AdminDescuentosPage() {
  const [discounts, setDiscounts] = React.useState<Discount[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  /**
   * "Now", fixed at load. Every state badge and every product age is derived
   * from this rather than from a fresh `Date.now()` during render, so the list
   * cannot reclassify itself halfway through a re-render.
   */
  const [nowMs, setNowMs] = React.useState(0);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<Discount | null>(null);
  /** True when the modal was opened by "Renovar" — changes copy and focus. */
  const [isRenewing, setIsRenewing] = React.useState(false);

  const [label, setLabel] = React.useState('');
  const [percentage, setPercentage] = React.useState<number>(0);
  const [scope, setScope] = React.useState<'GLOBAL' | 'CATEGORY' | 'PRODUCT'>('GLOBAL');
  const [categoryId, setCategoryId] = React.useState('');
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [startsAt, setStartsAt] = React.useState('');
  const [endsAt, setEndsAt] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [audience, setAudience] = React.useState<DiscountAudience>('ALL');
  /**
   * A STRING, not a number, and empty by default.
   *
   * Empty means "no quantity requirement", which is what the client wants for
   * almost every campaign and what every existing discount does. A numeric
   * state initialised to 0 or 1 would quietly turn an optional field into one
   * that always sends a value.
   */
  const [minQuantity, setMinQuantity] = React.useState('');

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
        setDiscounts(await resDiscs.json());
        setCategories(await resCats.json());
        setProducts(await resProds.json());
      }
      // Read the clock in the handler, never during render.
      setNowMs(Date.now());
    } catch (error) {
      console.error('Error loading discounts data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  const resetForm = (d: Discount | null) => {
    setEditingDiscount(d);
    setLabel(d?.label ?? '');
    setPercentage(d ? d.percentage : 10);
    setScope(d?.scope ?? 'GLOBAL');
    setCategoryId(d?.categoryId ?? '');
    setProductIds(d?.productIds ?? []);
    setStartsAt(toDateInput(d?.startsAt));
    setEndsAt(toDateInput(d?.endsAt));
    setActive(d?.active ?? true);
    setAudience(d?.audience ?? 'ALL');
    // A new discount opens with this BLANK, never prefilled — the field is the
    // exception, not the norm.
    setMinQuantity(d?.minQuantity ? String(d.minQuantity) : '');
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm(null);
    setIsRenewing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Discount) => {
    resetForm(d);
    setIsRenewing(false);
    setIsModalOpen(true);
  };

  /**
   * Renewal reopens the SAME row with its selection and percentage intact and
   * only the dates cleared, so saving updates it in place. Creating a copy
   * would leave the expired original behind to be cleaned up by hand, and the
   * client's ask was explicitly "renew rather than recreate".
   */
  const openRenewModal = (d: Discount) => {
    resetForm(d);
    setStartsAt('');
    setEndsAt('');
    setActive(true);
    setIsRenewing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la campaña de descuento "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/descuentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDiscounts((prev) => prev.filter((d) => d.id !== id));
        return;
      }
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Error al eliminar descuento');
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Error de conexión al eliminar el descuento');
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
          prev.map((item) => (item.id === d.id ? { ...item, active: !d.active } : item)),
        );
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (scope === 'PRODUCT' && productIds.length === 0) {
      setFormError('Selecciona al menos un producto para una campaña por producto.');
      return;
    }
    if (startsAt && endsAt && startsAt > endsAt) {
      setFormError('La fecha de inicio no puede ser posterior a la de fin.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      label: label.trim(),
      percentage: Number(percentage),
      scope,
      categoryId: scope === 'CATEGORY' ? categoryId : null,
      productIds: scope === 'PRODUCT' ? productIds : [],
      startsAt: fromDateInput(startsAt, 'start'),
      endsAt: fromDateInput(endsAt, 'end'),
      active,
      audience,
      // Empty input → null, i.e. no quantity requirement. The validator
      // normalises '' and 0 the same way, so this cannot accidentally gate a
      // campaign the admin did not mean to gate.
      minQuantity: minQuantity.trim() === '' ? null : Number(minQuantity),
    };

    try {
      const url = editingDiscount
        ? `/api/admin/descuentos/${editingDiscount.id}`
        : '/api/admin/descuentos';

      const res = await fetch(url, {
        method: editingDiscount ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Error al guardar descuento');
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
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-brand-neutral-500">
          Promociones automáticas sobre el catálogo, una categoría o varios productos.
          Los códigos de cupón se administran en{' '}
          <a href="/admin/cupones" className="text-brand-gold-deep hover:underline">
            Cupones
          </a>
          .
        </p>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="size-4" />
          <span>Crear Descuento</span>
        </Button>
      </div>

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
                  <th className="px-6 py-4">Alcance</th>
                  <th className="px-6 py-4">Vigencia</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-100 dark:divide-brand-neutral-800">
                {discounts.map((discount) => {
                  const state = getDiscountState(discount, nowMs);
                  return (
                    <tr
                      key={discount.id}
                      className="hover:bg-brand-neutral-50/50 dark:hover:bg-brand-neutral-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="size-4 text-brand-gold" />
                          <span className="font-semibold text-brand-neutral-800 dark:text-brand-neutral-250 text-sm">
                            {discount.label || 'Descuento Sin Nombre'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
                        <span className="flex items-center gap-1">
                          <Percent className="size-3 text-brand-gold" />
                          {discount.percentage}% OFF
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-brand-neutral-600 dark:text-brand-neutral-400">
                        <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-brand-neutral-100 dark:bg-brand-neutral-950 text-brand-neutral-500">
                          {discount.scope}
                        </span>
                        {discount.scope === 'CATEGORY' && (
                          <span className="block text-xs text-brand-neutral-400">
                            {categories.find((c) => c.id === discount.categoryId)?.name ??
                              'Desconocida'}
                          </span>
                        )}
                        {discount.scope === 'PRODUCT' && (
                          <span className="block text-xs text-brand-neutral-400">
                            {discount.productIds.length}{' '}
                            {discount.productIds.length === 1 ? 'producto' : 'productos'}
                          </span>
                        )}
                        {/*
                          Only rendered when the campaign actually narrows
                          itself. An "Audiencia: Todos / Sin mínimo" line on
                          every row would be noise on the overwhelming majority
                          of discounts, which set neither.
                        */}
                        {discount.audience !== 'ALL' && (
                          <span className="mt-1 block text-xs font-medium text-brand-gold-deep">
                            {discount.audience === 'WHOLESALE_ONLY'
                              ? 'Solo mayoristas'
                              : 'Solo minoristas'}
                          </span>
                        )}
                        {discount.minQuantity ? (
                          <span className="block text-xs font-medium text-brand-gold-deep">
                            Desde {discount.minQuantity} unidades
                          </span>
                        ) : null}
                      </td>

                      <td className="px-6 py-4 text-xs whitespace-nowrap text-brand-neutral-600 dark:text-brand-neutral-400">
                        {formatRange(discount.startsAt, discount.endsAt)}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleActiveStatus(discount)}
                          className="text-left"
                          title="Activar / desactivar"
                        >
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_BADGE[state]}`}
                          >
                            {STATE_LABEL[state]}
                          </span>
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          {/* Only an expired campaign can be renewed — on any
                              other state the button would be a confusing
                              synonym for Editar. */}
                          {state === 'EXPIRADO' && (
                            <button
                              onClick={() => openRenewModal(discount)}
                              className="inline-flex items-center gap-1 rounded border border-brand-gold/50 bg-brand-gold/10 px-2 py-1 text-xs font-medium text-brand-gold-deep transition-colors hover:bg-brand-gold/20"
                            >
                              <RefreshCw className="size-3" />
                              Renovar
                            </button>
                          )}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-2xl"
        title={
          isRenewing
            ? 'Renovar Descuento'
            : editingDiscount
              ? 'Editar Descuento'
              : 'Nuevo Descuento'
        }
        description={
          isRenewing
            ? 'Se conservan el porcentaje y la selección. Define las nuevas fechas de vigencia.'
            : editingDiscount
              ? 'Modifica los valores del descuento.'
              : 'Crea una nueva campaña promocional.'
        }
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="discount-form" disabled={isSubmitting || !label}>
              {isSubmitting ? 'Guardando...' : isRenewing ? 'Renovar' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="discount-form" onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
          {formError && (
            <div className="rounded bg-red-50 p-3 text-red-700 text-xs">{formError}</div>
          )}

          {isRenewing && (
            <div className="rounded bg-amber-50 p-3 text-xs text-amber-800">
              Renovando «{editingDiscount?.label}». Se actualizará la campaña existente,
              no se creará una nueva.
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
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
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
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
            </div>

            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Alcance *
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as Discount['scope'])}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              >
                <option value="GLOBAL">Global (todo el catálogo)</option>
                <option value="CATEGORY">Por Categoría</option>
                <option value="PRODUCT">Por Productos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Inicio (opcional)
              </label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
            </div>
            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Fin (opcional)
              </label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-brand-neutral-400">
            Deja una fecha en blanco para que no tenga límite por ese lado.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Audiencia *
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as DiscountAudience)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              >
                <option value="ALL">Todos</option>
                <option value="WHOLESALE_ONLY">Solo mayoristas</option>
                <option value="RETAIL_ONLY">Solo minoristas</option>
              </select>
              <p className="mt-1 text-xs text-brand-neutral-400">
                «Todos» es lo normal. «Solo mayoristas» aplica únicamente a
                cuentas mayoristas aprobadas.
              </p>
            </div>

            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Cantidad mínima (opcional)
              </label>
              <input
                type="number"
                min={2}
                step={1}
                placeholder="Sin mínimo"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
              <p className="mt-1 text-xs text-brand-neutral-400">
                Opcional. Si lo dejas vacío, el descuento aplica sin importar la
                cantidad comprada — así funciona hoy. Solo actívalo si quieres
                que este descuento en particular requiera una cantidad mínima
                para aplicar.
              </p>
            </div>
          </div>

          {scope === 'CATEGORY' && (
            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Seleccionar Categoría *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `└─ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'PRODUCT' && (
            <div>
              <label className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Productos incluidos *
              </label>
              <DiscountProductPicker
                products={products}
                selectedIds={productIds}
                onChange={setProductIds}
                nowMs={nowMs}
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-brand-gold focus:ring-brand-gold size-4 border-brand-neutral-300"
            />
            <label
              htmlFor="active"
              className="text-sm text-brand-neutral-700 dark:text-brand-neutral-300"
            >
              Descuento activo
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
