'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, Check, X, Phone, Calendar } from 'lucide-react';
import { formatCOP } from '@/lib/utils/pricing';
import { Button } from '@/components/ui/button';

type OrderStatus = 'PENDING_WHATSAPP' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

interface OrderItemView {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  /** Null for orders placed before variants existed, and for simple products. */
  color: string | null;
  reference: string | null;
}

interface OrderView {
  id: string;
  total: number;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  wholesaleUserId: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItemView[];
}

type Tab = 'PENDIENTES' | 'CONFIRMADOS' | 'RECHAZADOS' | 'TODOS';

const STATUS_MAP: Record<Tab, OrderStatus | null> = {
  PENDIENTES: 'PENDING_WHATSAPP',
  CONFIRMADOS: 'CONFIRMED',
  RECHAZADOS: 'REJECTED',
  TODOS: null,
};

const STATUS_BADGE: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_WHATSAPP: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
  },
  CONFIRMED: {
    label: 'Confirmado',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rechazado',
    className: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-brand-neutral-100 text-brand-neutral-500 dark:bg-brand-neutral-900 dark:text-brand-neutral-400',
  },
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = React.useState<OrderView[]>([]);
  const [activeTab, setActiveTab] = React.useState<Tab>('PENDIENTES');
  const [isLoading, setIsLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const loadOrders = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pedidos');
      if (res.ok) setOrders(await res.json());
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadOrders());
  }, [loadOrders]);

  const handleAction = async (id: string, action: 'confirm' | 'reject') => {
    setProcessingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? 'Error al procesar el pedido');
      }
      await loadOrders();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = React.useMemo(() => {
    const status = STATUS_MAP[activeTab];
    return status ? orders.filter((o) => o.status === status) : orders;
  }, [orders, activeTab]);

  const tabOptions: { key: Tab; label: string; count: number }[] = [
    {
      key: 'PENDIENTES',
      label: 'Pendientes',
      count: orders.filter((o) => o.status === 'PENDING_WHATSAPP').length,
    },
    {
      key: 'CONFIRMADOS',
      label: 'Confirmados',
      count: orders.filter((o) => o.status === 'CONFIRMED').length,
    },
    {
      key: 'RECHAZADOS',
      label: 'Rechazados',
      count: orders.filter((o) => o.status === 'REJECTED').length,
    },
    { key: 'TODOS', label: 'Todos', count: orders.length },
  ];

  return (
    <div className="space-y-6">
      <p className="font-sans text-sm text-brand-neutral-500">
        Revisa y confirma los pedidos solicitados por WhatsApp.
      </p>

      {/* Tabs */}
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
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.key
                  ? 'bg-brand-gold/15 text-brand-gold'
                  : 'bg-brand-neutral-100 dark:bg-brand-neutral-900 text-brand-neutral-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950/20 dark:bg-red-950/20 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Orders list */}
      <div className="rounded-xl border border-brand-neutral-200 bg-white overflow-hidden shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-brand-neutral-400 font-sans text-sm">
            <p>No hay pedidos en esta sección.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-neutral-100 dark:divide-brand-neutral-800">
            {filteredOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const badge = STATUS_BADGE[order.status];

              return (
                <div key={order.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-brand-neutral-50/50 dark:hover:bg-brand-neutral-800/20"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {isExpanded ? (
                        <ChevronUp className="size-4 shrink-0 text-brand-neutral-400" />
                      ) : (
                        <ChevronDown className="size-4 shrink-0 text-brand-neutral-400" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-sans text-sm font-semibold text-brand-neutral-900 dark:text-brand-neutral-100">
                          Pedido #{order.id.slice(-6).toUpperCase()} — {order.customerName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 font-sans text-xs text-brand-neutral-400">
                          <Calendar className="size-3" />
                          {new Date(order.createdAt).toLocaleString('es-CO')}
                          <Phone className="ml-2 size-3" />
                          {order.customerPhone}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-sans text-sm font-semibold text-brand-neutral-900 dark:text-brand-neutral-100">
                        {formatCOP(order.total)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-brand-neutral-50/50 px-6 py-4 dark:bg-brand-neutral-950">
                      <ul className="mb-4 space-y-2">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start justify-between gap-4 font-sans text-sm"
                          >
                            <span className="text-brand-neutral-700 dark:text-brand-neutral-300">
                              {item.name} x{item.quantity}
                              {/* Colour and reference are what the client
                                  picks and packs from — without them two
                                  colours of one product are identical here. */}
                              {(item.color || item.reference) && (
                                <span className="mt-0.5 block text-xs text-brand-neutral-500">
                                  {item.color && <>Color: {item.color}</>}
                                  {item.color && item.reference && ' · '}
                                  {item.reference && <>Ref: {item.reference}</>}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-medium text-brand-neutral-900 dark:text-brand-neutral-100">
                              {formatCOP(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {order.status === 'PENDING_WHATSAPP' && (
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={processingId === order.id}
                            onClick={() => handleAction(order.id, 'reject')}
                            className="flex items-center gap-1.5 text-red-600 hover:text-red-700"
                          >
                            <X className="size-3.5" />
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            disabled={processingId === order.id}
                            onClick={() => handleAction(order.id, 'confirm')}
                            className="flex items-center gap-1.5"
                          >
                            <Check className="size-3.5" />
                            {processingId === order.id ? 'Procesando…' : 'Confirmar (descuenta stock)'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
