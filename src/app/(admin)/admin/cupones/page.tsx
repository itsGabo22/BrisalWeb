'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, Ticket } from 'lucide-react';
import type { Coupon } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  fromDateInput,
  getCouponState,
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

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  /** Fixed at load — state badges must not reclassify mid-render. */
  const [nowMs, setNowMs] = React.useState(0);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Coupon | null>(null);

  const [code, setCode] = React.useState('');
  const [percentage, setPercentage] = React.useState<number>(10);
  const [startsAt, setStartsAt] = React.useState('');
  const [endsAt, setEndsAt] = React.useState('');
  const [usageLimit, setUsageLimit] = React.useState('');
  const [active, setActive] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadCoupons = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cupones');
      if (res.ok) setCoupons(await res.json());
      setNowMs(Date.now());
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadCoupons());
  }, [loadCoupons]);

  const openCreateModal = () => {
    setEditing(null);
    setCode('');
    setPercentage(10);
    setStartsAt('');
    setEndsAt('');
    setUsageLimit('');
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditing(coupon);
    setCode(coupon.code);
    setPercentage(coupon.percentage);
    setStartsAt(toDateInput(coupon.startsAt));
    setEndsAt(toDateInput(coupon.endsAt));
    setUsageLimit(coupon.usageLimit != null ? String(coupon.usageLimit) : '');
    setActive(coupon.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (startsAt && endsAt && startsAt > endsAt) {
      setFormError('La fecha de inicio no puede ser posterior a la de fin.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(
        editing ? `/api/admin/cupones/${editing.id}` : '/api/admin/cupones',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code.trim(),
            percentage: Number(percentage),
            active,
            startsAt: fromDateInput(startsAt, 'start'),
            endsAt: fromDateInput(endsAt, 'end'),
            usageLimit: usageLimit.trim() ? Number(usageLimit) : null,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error al guardar el cupón');
      }

      await loadCoupons();
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el cupón "${coupon.code}"?`)) return;

    try {
      const res = await fetch(`/api/admin/cupones/${coupon.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
        return;
      }
      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Error al eliminar cupón');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Error de conexión al eliminar el cupón');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/cupones/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, active: !coupon.active } : c)),
        );
      }
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-brand-neutral-500">
          Códigos que el cliente escribe en el carrito. Se aplican sobre el subtotal,
          después de los descuentos automáticos.
        </p>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="size-4" />
          <span>Nuevo Cupón</span>
        </Button>
      </div>

      <div className="rounded-xl border border-brand-neutral-200 bg-white overflow-hidden shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 font-sans text-brand-neutral-500">
            <Ticket className="size-6 text-brand-neutral-300" aria-hidden="true" />
            <p className="mt-2 text-lg">No hay cupones creados.</p>
            <p className="text-sm text-brand-neutral-400">
              Crea uno para que tus clientes lo usen en el carrito.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-brand-neutral-100 dark:border-brand-neutral-800 bg-brand-neutral-50 dark:bg-brand-neutral-950 text-xs font-semibold uppercase tracking-wider text-brand-neutral-500 dark:text-brand-neutral-400">
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Descuento</th>
                  <th className="px-6 py-4">Usos</th>
                  <th className="px-6 py-4">Vigencia</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-100 dark:divide-brand-neutral-800">
                {coupons.map((coupon) => {
                  const state = getCouponState(coupon, nowMs);
                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-brand-neutral-50/50 dark:hover:bg-brand-neutral-800/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2">
                          <Ticket className="size-4 shrink-0 text-brand-gold" />
                          <span className="rounded border border-dashed border-brand-neutral-300 bg-brand-neutral-50 px-2 py-0.5 font-mono text-sm font-semibold text-brand-neutral-800 dark:border-brand-neutral-700 dark:bg-brand-neutral-950 dark:text-brand-neutral-200">
                            {coupon.code}
                          </span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
                        {coupon.percentage}% OFF
                      </td>

                      <td className="px-6 py-4 text-sm text-brand-neutral-600 dark:text-brand-neutral-400">
                        {coupon.usageCount}
                        {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ' / ∞'}
                      </td>

                      <td className="px-6 py-4 text-xs whitespace-nowrap text-brand-neutral-600 dark:text-brand-neutral-400">
                        {formatRange(coupon.startsAt, coupon.endsAt)}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleActive(coupon)}
                          className="text-left"
                          title="Activar / desactivar"
                        >
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_BADGE[state]}`}
                          >
                            {STATE_LABEL[state]}
                          </span>
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1 text-brand-neutral-500 hover:text-brand-gold transition-colors"
                            aria-label={`Editar ${coupon.code}`}
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-1 text-brand-neutral-500 hover:text-red-500 transition-colors"
                            aria-label={`Eliminar ${coupon.code}`}
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
        title={editing ? 'Editar Cupón' : 'Nuevo Cupón'}
        description={
          editing
            ? 'Modifica el cupón. El contador de usos no se puede editar.'
            : 'Crea un código para que tus clientes lo usen en el carrito.'
        }
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="coupon-form"
              disabled={isSubmitting || code.trim().length < 3}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="coupon-form" onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
          {formError && (
            <div className="rounded bg-red-50 p-3 text-red-700 text-xs">{formError}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="coupon-code"
                className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1"
              >
                Código *
              </label>
              <input
                id="coupon-code"
                type="text"
                required
                value={code}
                // Uppercased as they type, so what they see is exactly what is
                // stored and what the shopper has to type.
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="BRISAL10"
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 font-mono text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
              <p className="mt-1 text-xs text-brand-neutral-400">
                Letras, números y guiones. No distingue mayúsculas al aplicarlo.
              </p>
            </div>

            <div>
              <label
                htmlFor="coupon-percentage"
                className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1"
              >
                Porcentaje (%) *
              </label>
              <input
                id="coupon-percentage"
                type="number"
                required
                min={1}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="coupon-start"
                className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1"
              >
                Inicio (opcional)
              </label>
              <input
                id="coupon-start"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
            </div>
            <div>
              <label
                htmlFor="coupon-end"
                className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1"
              >
                Fin (opcional)
              </label>
              <input
                id="coupon-end"
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="coupon-limit"
              className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1"
            >
              Límite de usos (opcional)
            </label>
            <input
              id="coupon-limit"
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Sin límite"
              className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-850 focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
            {editing && (
              <p className="mt-1 text-xs text-brand-neutral-400">
                Usos actuales: {editing.usageCount}.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="coupon-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-brand-gold focus:ring-brand-gold size-4 border-brand-neutral-300"
            />
            <label
              htmlFor="coupon-active"
              className="text-sm text-brand-neutral-700 dark:text-brand-neutral-300"
            >
              Cupón activo
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
