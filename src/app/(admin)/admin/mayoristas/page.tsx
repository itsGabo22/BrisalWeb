'use client';

import * as React from 'react';
import { Mail, Phone, MapPin, Building, Calendar, Check, X, Undo2, Trash2, ShieldOff } from 'lucide-react';
import type { Wholesaler } from '@/types';
import { Modal } from '@/components/ui/modal';

type Tab = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REVOCADO';

export default function AdminMayoristasPage() {
  const [wholesalers, setWholesalers] = React.useState<Wholesaler[]>([]);
  const [activeTab, setActiveTab] = React.useState<Tab>('PENDIENTE');
  const [isLoading, setIsLoading] = React.useState(true);
  /**
   * The account awaiting a revoke confirmation, or null.
   *
   * A real Modal rather than `confirm()` — which is what the neighbouring
   * delete action uses — because revoking hits a LIVE customer who has been
   * buying at wholesale prices, and the admin needs to see whose access they
   * are about to withdraw and what does (and does not) happen to their orders.
   * A one-line native dialog cannot say that.
   */
  const [revokeTarget, setRevokeTarget] = React.useState<Wholesaler | null>(null);
  const [isRevoking, setIsRevoking] = React.useState(false);

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

  /**
   * Revokes an approved wholesaler's access.
   *
   * Reuses the same PATCH endpoint as approve/reject — this is a status
   * transition, not a deletion. The server independently refuses to revoke
   * anything that is not currently approved, so the button's visibility is
   * convenience, not the guarantee.
   */
  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);

    try {
      const res = await fetch(`/api/admin/mayoristas/${revokeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'REVOCADO' }),
      });

      if (res.ok) {
        const updated: Wholesaler = await res.json();
        setWholesalers((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        setRevokeTarget(null);
        // Follows the account to where it now lives, so the admin sees the
        // change land instead of watching the card vanish from the tab they are
        // looking at.
        setActiveTab('REVOCADO');
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? 'Error al revocar el acceso');
      }
    } catch (error) {
      console.error('Error revoking wholesaler:', error);
      alert('Error de conexión al revocar el acceso');
    } finally {
      setIsRevoking(false);
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
    {
      key: 'REVOCADO',
      label: 'Revocadas',
      count: wholesalers.filter((w) => w.estado === 'REVOCADO').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="font-sans text-sm text-brand-neutral-500">
        Revisa, aprueba o rechaza solicitudes de clientes interesados en
        convertirse en distribuidores mayoristas. También puedes revocarle el
        acceso a una cuenta ya aprobada — sus pedidos anteriores se conservan.
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
                  {/* REVOCADO reads slate, not red: it is a withdrawn account,
                      not a refused application, and the two must be tellable
                      apart at a glance. */}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                    w.estado === 'APROBADO'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : w.estado === 'RECHAZADO'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      : w.estado === 'REVOCADO'
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300'
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

                {/*
                  APROBADO only — the one state where there is access to take
                  away. Mirrors the server's guard in the PATCH handler.
                */}
                {w.estado === 'APROBADO' && (
                  <button
                    onClick={() => setRevokeTarget(w)}
                    className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-950/30 dark:bg-amber-950/30 dark:text-amber-400 transition-colors"
                  >
                    <ShieldOff className="size-3.5" />
                    <span>Revocar acceso</span>
                  </button>
                )}

                {/*
                  Re-approval, offered straight from the revoked card: the
                  status model makes reinstating someone the same transition as
                  approving them, and they keep their id and their orders.
                */}
                {w.estado === 'REVOCADO' && (
                  <button
                    onClick={() => handleUpdateStatus(w.id, 'APROBADO')}
                    className="flex items-center gap-1.5 rounded-md border border-emerald-250 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-950/20 dark:bg-emerald-950/30 dark:text-emerald-400 transition-colors"
                  >
                    <Check className="size-3.5" />
                    <span>Reactivar acceso</span>
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

      {/*
        Revoke confirmation. Spells out both halves of what happens, because the
        thing an admin is most likely to fear here — losing the customer's
        purchase history — is exactly the thing that does NOT happen.
      */}
      <Modal
        isOpen={revokeTarget !== null}
        onClose={() => !isRevoking && setRevokeTarget(null)}
        title="Revocar acceso mayorista"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRevokeTarget(null)}
              disabled={isRevoking}
              className="rounded-md border border-brand-neutral-200 px-4 py-2 font-sans text-sm font-medium text-brand-neutral-600 transition-colors hover:bg-brand-neutral-50 disabled:opacity-50 dark:border-brand-neutral-800 dark:text-brand-neutral-400"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-100 px-4 py-2 font-sans text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-200 disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <ShieldOff className="size-4" />
              {isRevoking ? 'Revocando…' : 'Sí, revocar acceso'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 font-sans text-sm text-brand-neutral-600 dark:text-brand-neutral-350">
          <p>
            Vas a retirarle el acceso mayorista a{' '}
            <strong className="text-brand-neutral-900 dark:text-brand-neutral-100">
              {revokeTarget?.nombre}
            </strong>
            {revokeTarget?.negocio ? ` (${revokeTarget.negocio})` : ''}.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Dejará de ver precios mayoristas de inmediato y pasará a ver los
              precios normales.
            </li>
            <li>
              Su historial de pedidos se conserva completo y seguirá visible en
              Pedidos.
            </li>
            <li>
              La cuenta no se elimina: podrás reactivarle el acceso más adelante
              desde la pestaña «Revocadas».
            </li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
