'use client';

import * as React from 'react';
import { Mail, Phone, MapPin, Building, Calendar, Check, X, Undo2, Trash2 } from 'lucide-react';
import type { Wholesaler } from '@/types';

type Tab = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export default function AdminMayoristasPage() {
  const [wholesalers, setWholesalers] = React.useState<Wholesaler[]>([]);
  const [activeTab, setActiveTab] = React.useState<Tab>('PENDIENTE');
  const [isLoading, setIsLoading] = React.useState(true);

  const loadWholesalers = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mayoristas');
      if (res.ok) {
        const data = await res.json();
        setWholesalers(data);
      }
    } catch (error) {
      console.error('Error loading wholesalers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadWholesalers());
  }, [loadWholesalers]);

  const handleUpdateStatus = async (id: string, newStatus: Tab) => {
    try {
      const res = await fetch(`/api/admin/mayoristas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (res.ok) {
        // Applies whatever the server actually persisted, not the status we
        // asked for -- now that RECHAZADO is a real row (not an immediate
        // delete), this is what makes the card survive a refresh correctly.
        const updated: Wholesaler = await res.json();
        setWholesalers((prev) => prev.map((w) => (w.id === id ? updated : w)));
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  /**
   * Delete is scoped to REJECTED records only -- the button below only
   * renders for `w.estado === 'RECHAZADO'`, and the server independently
   * refuses to delete anything else, so this can't be reached for an
   * approved or pending application even by mistake.
   */
  const handleDelete = async (w: Wholesaler) => {
    if (
      !confirm(
        `¿Eliminar definitivamente la solicitud rechazada de "${w.nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/mayoristas/${w.id}`, { method: 'DELETE' });
      if (res.ok) {
        setWholesalers((prev) => prev.filter((x) => x.id !== w.id));
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? 'Error al eliminar la solicitud');
      }
    } catch (error) {
      console.error('Error deleting wholesaler:', error);
      alert('Error de conexión al eliminar la solicitud');
    }
  };

  const filteredWholesalers = wholesalers.filter((w) => w.estado === activeTab);

  // Tabs setup
  const tabOptions: { key: Tab; label: string; count: number }[] = [
    {
      key: 'PENDIENTE',
      label: 'Pendientes',
      count: wholesalers.filter((w) => w.estado === 'PENDIENTE').length,
    },
    {
      key: 'APROBADO',
      label: 'Aprobadas',
      count: wholesalers.filter((w) => w.estado === 'APROBADO').length,
    },
    {
      key: 'RECHAZADO',
      label: 'Rechazadas',
      count: wholesalers.filter((w) => w.estado === 'RECHAZADO').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="font-sans text-sm text-brand-neutral-500">
        Revisa, aprueba o rechaza solicitudes de clientes interesados en convertirse en distribuidores mayoristas.
      </p>

      {/* Tabs selector */}
      <div className="flex border-b border-brand-neutral-200 dark:border-brand-neutral-800 font-sans text-sm">
        {tabOptions.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 font-medium transition-all ${
              activeTab === tab.key
                ? 'border-brand-gold text-brand-gold font-semibold'
                : 'border-transparent text-brand-neutral-500 hover:text-brand-neutral-800 dark:hover:text-brand-neutral-250'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === tab.key
                ? 'bg-brand-gold/15 text-brand-gold'
                : 'bg-brand-neutral-100 dark:bg-brand-neutral-900 text-brand-neutral-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : filteredWholesalers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-xl bg-white border-brand-neutral-200 text-brand-neutral-400 font-sans">
          <p>No hay solicitudes en esta sección.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredWholesalers.map((w) => (
            <div
              key={w.id}
              className="flex flex-col justify-between rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors font-sans text-sm"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-brand-neutral-900 dark:text-brand-neutral-100">
                      {w.nombre}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-brand-neutral-400 mt-1">
                      <Calendar className="size-3.5" />
                      <span>{new Date(w.fechaRegistro).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>

                  {/* Badge */}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                    w.estado === 'APROBADO'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : w.estado === 'RECHAZADO'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                  }`}>
                    {w.estado}
                  </span>
                </div>

                {/* Business Info */}
                <div className="grid gap-2 text-brand-neutral-600 dark:text-brand-neutral-350 border-t border-b border-brand-neutral-100 dark:border-brand-neutral-800 py-3 my-3">
                  <div className="flex items-center gap-2">
                    <Building className="size-4 text-brand-gold flex-shrink-0" />
                    {/* nombreNegocio is optional (Part 5) -- the API already
                        coerces null to '', so a blank value reads as an em
                        dash here instead of an empty gap next to the icon. */}
                    <span className="font-semibold">{w.negocio || '—'}</span>
                    <span className="text-xs text-brand-neutral-400">(NIT/CC: {w.nit})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-brand-gold flex-shrink-0" />
                    <span>{w.ciudad}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-brand-neutral-400 flex-shrink-0" />
                    <a href={`mailto:${w.email}`} className="hover:underline text-brand-gold">{w.email}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-brand-neutral-400 flex-shrink-0" />
                    <a href={`tel:${w.telefono}`} className="hover:underline">{w.telefono}</a>
                  </div>
                </div>

                {/* Message */}
                {w.mensaje && (
                  <div className="rounded bg-brand-neutral-50 dark:bg-brand-neutral-950 p-3 text-brand-neutral-600 dark:text-brand-neutral-400 italic text-xs">
                    &ldquo;{w.mensaje}&rdquo;
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-brand-neutral-100 dark:border-brand-neutral-800">
                {w.estado === 'PENDIENTE' ? (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(w.id, 'RECHAZADO')}
                      className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-950/20 dark:bg-red-950/30 dark:text-red-400 transition-colors"
                    >
                      <X className="size-3.5" />
                      <span>Rechazar</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(w.id, 'APROBADO')}
                      className="flex items-center gap-1.5 rounded-md border border-emerald-250 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-950/20 dark:bg-emerald-950/30 dark:text-emerald-400 transition-colors"
                    >
                      <Check className="size-3.5" />
                      <span>Aprobar</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(w.id, 'PENDIENTE')}
                    className="flex items-center gap-1.5 rounded-md border border-brand-neutral-200 px-3 py-1.5 text-xs font-semibold text-brand-neutral-600 hover:bg-brand-neutral-50 dark:border-brand-neutral-800 dark:text-brand-neutral-400 transition-colors"
                  >
                    <Undo2 className="size-3.5" />
                    <span>Volver a Pendientes</span>
                  </button>
                )}
                {/* Scoped to RECHAZADO only -- never rendered for APROBADO or
                    PENDIENTE, matching the server-side guard in the DELETE
                    handler. */}
                {w.estado === 'RECHAZADO' && (
                  <button
                    onClick={() => handleDelete(w)}
                    className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
