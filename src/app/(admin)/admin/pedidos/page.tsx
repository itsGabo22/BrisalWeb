'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Phone,
  Calendar,
  Clock,
  Search,
  Trash2,
  Ticket,
} from 'lucide-react';
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
  /**
   * Units of this line that were beyond the colour's stock — what the client
   * still has to produce or restock. 0 on a fully in-stock line, and on every
   * order placed before sobrepedido existed.
   */
  backorderQty: number;
}

interface OrderView {
  id: string;
  total: number;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  wholesaleUserId: string | null;
  /** The code as typed at checkout, and what it took off. Null when none. */
  couponCode: string | null;
  couponDiscountAmount: number | null;
  notes: string | null;
  createdAt: string;
  items: OrderItemView[];
}

/**
 * SOBREPEDIDO is not a status — an order with backordered lines can be pending
 * or already confirmed. It is a cross-cutting view of "what do I still owe",
 * which is why it filters on the items rather than on `order.status`.
 *
 * Kept even though NO NEW order can ever land here: `POST /api/ordenes` now
 * refuses a line beyond stock instead of recording a shortfall. The existing
 * orders that carry a real `backorderQty` are the client's own record of units
 * they still owe, and removing the tab would hide them.
 */
type Tab = 'PENDIENTES' | 'CONFIRMADOS' | 'SOBREPEDIDO' | 'RECHAZADOS' | 'TODOS';

const STATUS_MAP: Record<Tab, OrderStatus | null> = {
  PENDIENTES: 'PENDING_WHATSAPP',
  CONFIRMADOS: 'CONFIRMED',
  SOBREPEDIDO: null,
  RECHAZADOS: 'REJECTED',
  TODOS: null,
};

/**
 * Date presets plus a custom range.
 *
 * Presets rather than two date inputs as the primary control: "¿qué entró hoy?"
 * and "¿cómo cerró la semana?" are the questions actually being asked of this
 * screen, and both are one click here instead of two date pickers typed
 * correctly. The custom range stays for anything else — month-end closes, in
 * particular, which is what the client reconciles against.
 */
const DATE_RANGES = [
  { value: 'all', label: 'Todo el tiempo' },
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'custom', label: 'Rango personalizado' },
] as const;

type DateRange = (typeof DATE_RANGES)[number]['value'];

/** Local midnight N days back — `startOfToday()` at N = 0. */
function daysAgoStart(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * The `[from, to)` window a range selection means, in LOCAL time.
 *
 * Local rather than UTC on purpose: an order placed at 9pm in Colombia is
 * "today" to the person reading this screen, and a UTC boundary would file it
 * under tomorrow. `null` bounds are open ends.
 *
 * A custom `to` is pushed to the START OF THE NEXT DAY so the chosen end date
 * is included — a plain `new Date('2026-08-20')` is that day's midnight, which
 * would silently exclude everything that happened on it.
 */
function resolveDateWindow(
  range: DateRange,
  customFrom: string,
  customTo: string,
): { from: Date | null; to: Date | null } {
  if (range === 'today') return { from: daysAgoStart(0), to: null };
  if (range === '7d') return { from: daysAgoStart(6), to: null };
  if (range === '30d') return { from: daysAgoStart(29), to: null };

  if (range === 'custom') {
    const from = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
    const to = customTo ? new Date(`${customTo}T00:00:00`) : null;
    if (to) to.setDate(to.getDate() + 1);
    return {
      from: from && !Number.isNaN(from.getTime()) ? from : null,
      to: to && !Number.isNaN(to.getTime()) ? to : null,
    };
  }

  return { from: null, to: null };
}

/**
 * What the search box matches: the 6-character order code the client quotes on
 * WhatsApp, the full id (so a link or a log line can be pasted straight in),
 * the customer's name, and their phone. Case- and accent-insensitive, partial.
 *
 * Phone is normalised to digits on BOTH sides, so "300 123" finds a number
 * stored as "3001234567" — the client types numbers the way they were dictated,
 * not the way they were saved.
 */
function matchesSearch(order: OrderView, query: string): boolean {
  const needle = normalizeText(query);
  if (!needle) return true;

  const code = order.id.slice(-6).toUpperCase();
  const haystack = [code, order.id, order.customerName ?? ''].map(normalizeText);
  if (haystack.some((value) => value.includes(needle))) return true;

  const digits = needle.replace(/\D/g, '');
  if (digits.length > 0) {
    const phone = (order.customerPhone ?? '').replace(/\D/g, '');
    if (phone.length > 0 && phone.includes(digits)) return true;
  }

  return false;
}

/** Lowercased and stripped of accents, so "monica" finds "Mónica". */
function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Units this order still owes across every line. 0 = nothing to restock. */
function totalBackorderQty(order: OrderView): number {
  return order.items.reduce((total, item) => total + (item.backorderQty ?? 0), 0);
}

/**
 * A cancelled or rejected order owes nothing — it was never going to ship — so
 * it must not sit in the restock list forever.
 */
function hasPendingBackorder(order: OrderView): boolean {
  if (order.status === 'REJECTED' || order.status === 'CANCELLED') return false;
  return totalBackorderQty(order) > 0;
}

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

  /**
   * Search and date compose with the status tabs rather than replacing them:
   * all three narrow the same list, so "los rechazados de la semana pasada de
   * Mónica" is one view. Filtering happens client-side because this route
   * already returns every order in one GET — adding query params would mean a
   * round trip per keystroke for a list this size.
   */
  const [search, setSearch] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange>('all');
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');

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

  /**
   * Rejecting is now an inventory movement, not just a status change: it returns
   * the order's reserved units to stock. That is worth one confirmation click —
   * every other action in this admin that changes data irreversibly asks first,
   * and an accidental rejection now silently puts units back on sale that the
   * client may have already set aside for this customer.
   */
  const handleReject = (order: OrderView) => {
    const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
    if (
      !confirm(
        // Verb agrees too: "Se devolverá 1 unidad", "Se devolverán 2 unidades".
        `¿Rechazar el pedido #${order.id.slice(-6).toUpperCase()} de "${order.customerName ?? 'sin nombre'}"? ${
          units === 1 ? 'Se devolverá 1 unidad' : `Se devolverán ${units} unidades`
        } al inventario.`,
      )
    ) {
      return;
    }
    void handleAction(order.id, 'reject');
  };

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

  /**
   * Delete, scoped to REJECTED. The button only renders for a rejected order
   * and the server independently refuses anything else, so a confirmed order
   * cannot be reached from here even by mistake — the same belt-and-braces the
   * rejected-wholesaler delete uses.
   *
   * `confirm()` because that is what every delete in this admin uses
   * (categorías, materiales, cupones, descuentos, reseñas, productos, imágenes,
   * mayoristas). A bespoke modal for this one action would be the odd one out,
   * and the client has learned the native dialog.
   */
  const handleDelete = async (order: OrderView) => {
    const code = order.id.slice(-6).toUpperCase();
    const couponNote = order.couponCode
      ? ` Se devolverá el uso del cupón ${order.couponCode}.`
      : '';
    if (
      !confirm(
        `¿Eliminar definitivamente el pedido rechazado #${code} de "${order.customerName ?? 'sin nombre'}"? Esta acción no se puede deshacer.${couponNote}`,
      )
    ) {
      return;
    }

    setProcessingId(order.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/pedidos/${order.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? 'Error al eliminar el pedido');
      }
      setOrders((prev) => prev.filter((existing) => existing.id !== order.id));
      // The row is gone, so an expansion pointing at it would be orphaned.
      setExpandedId((current) => (current === order.id ? null : current));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Search + date applied WITHOUT the status tab.
   *
   * Split out from the status pass so the tab COUNTS can be computed against
   * it: searching a customer's name should show "Pendientes 1 · Confirmados 3"
   * for that customer, not the totals for the whole shop. Counts that ignored
   * the search would send the client clicking through tabs that turn out empty
   * — the opposite of "nothing feels lost".
   */
  const scopedOrders = React.useMemo(() => {
    const { from, to } = resolveDateWindow(dateRange, customFrom, customTo);

    return orders.filter((order) => {
      if (!matchesSearch(order, search)) return false;
      if (!from && !to) return true;
      const createdAt = new Date(order.createdAt);
      if (from && createdAt < from) return false;
      if (to && createdAt >= to) return false;
      return true;
    });
  }, [orders, search, dateRange, customFrom, customTo]);

  /** Status AND search AND date — narrowing, never replacing. */
  const filteredOrders = React.useMemo(() => {
    if (activeTab === 'SOBREPEDIDO') return scopedOrders.filter(hasPendingBackorder);
    const status = STATUS_MAP[activeTab];
    return status ? scopedOrders.filter((order) => order.status === status) : scopedOrders;
  }, [scopedOrders, activeTab]);

  /** True when anything beyond the status tab is narrowing the list. */
  const hasExtraFilters =
    search.trim().length > 0 ||
    dateRange !== 'all' ||
    Boolean(customFrom) ||
    Boolean(customTo);

  const clearExtraFilters = () => {
    setSearch('');
    setDateRange('all');
    setCustomFrom('');
    setCustomTo('');
  };

  const tabOptions: { key: Tab; label: string; count: number }[] = [
    {
      key: 'PENDIENTES',
      label: 'Pendientes',
      count: scopedOrders.filter((o) => o.status === 'PENDING_WHATSAPP').length,
    },
    {
      key: 'CONFIRMADOS',
      label: 'Confirmados',
      count: scopedOrders.filter((o) => o.status === 'CONFIRMED').length,
    },
    {
      key: 'SOBREPEDIDO',
      label: 'Con sobrepedido',
      count: scopedOrders.filter(hasPendingBackorder).length,
    },
    {
      key: 'RECHAZADOS',
      label: 'Rechazados',
      count: scopedOrders.filter((o) => o.status === 'REJECTED').length,
    },
    { key: 'TODOS', label: 'Todos', count: scopedOrders.length },
  ];

  return (
    <div className="space-y-6">
      <p className="font-sans text-sm text-brand-neutral-500">
        Revisa y confirma los pedidos solicitados por WhatsApp.
      </p>

      {/*
        Search + date, above the tabs because they scope what the tabs count.
        Both compose with whichever tab is active — see `scopedOrders`.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre o teléfono"
            aria-label="Buscar pedidos"
            className="w-full rounded-md border border-brand-neutral-200 bg-white py-2 pr-3 pl-9 font-sans text-sm text-brand-neutral-900 placeholder:text-brand-neutral-400 focus-visible:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
          />
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          aria-label="Filtrar por fecha"
          className="rounded-md border border-brand-neutral-200 bg-white px-3 py-2 font-sans text-sm text-brand-neutral-900 focus-visible:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
        >
          {DATE_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>

        {/* The two date inputs appear only for the custom range — they are dead
            controls under a preset, and a dead control reads as broken. */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 font-sans text-sm">
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              aria-label="Desde"
              className="rounded-md border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-900 focus-visible:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
            <span className="text-brand-neutral-400">→</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              aria-label="Hasta"
              className="rounded-md border border-brand-neutral-200 bg-white px-3 py-2 text-brand-neutral-900 focus-visible:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
            />
          </div>
        )}

        {hasExtraFilters && (
          <button
            type="button"
            onClick={clearExtraFilters}
            className="inline-flex items-center gap-1.5 font-sans text-sm text-brand-neutral-500 transition-colors hover:text-brand-neutral-800 dark:hover:text-brand-neutral-200"
          >
            <X className="size-3.5" />
            Limpiar filtros
          </button>
        )}

        {/* States plainly how many of how many are showing, so a narrowed list
            can never be mistaken for the whole ledger. */}
        {hasExtraFilters && !isLoading && (
          <span className="font-sans text-xs text-brand-neutral-400">
            {scopedOrders.length} de {orders.length} pedidos coinciden
          </span>
        )}
      </div>

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
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-brand-neutral-400 font-sans text-sm">
            <p>No hay pedidos en esta sección.</p>
            {/* Distinguishes "nothing here" from "nothing MATCHES here" — the
                second is the one that makes an order feel lost. */}
            {hasExtraFilters && (
              <button
                type="button"
                onClick={clearExtraFilters}
                className="text-brand-gold underline-offset-2 hover:underline"
              >
                Quitar los filtros de búsqueda y fecha
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-brand-neutral-100 dark:divide-brand-neutral-800">
            {filteredOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const badge = STATUS_BADGE[order.status];
              const backordered = totalBackorderQty(order);
              const showsBackorder = hasPendingBackorder(order);

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
                      {/* Sits next to the status, not instead of it — an order
                          can be confirmed AND still owe units. The count is
                          here so the client sees how much to produce without
                          having to open the order. */}
                      {showsBackorder && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
                          <Clock className="size-3" aria-hidden="true" />
                          Sobrepedido · {backordered}
                        </span>
                      )}
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
                              {/* Per line, because the restocking is per
                                  colour: the order total says how much, this
                                  says of WHAT. */}
                              {item.backorderQty > 0 && (
                                <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-400">
                                  <Clock className="size-3 shrink-0" aria-hidden="true" />
                                  Sobrepedido: faltan {item.backorderQty}{' '}
                                  {item.backorderQty === 1 ? 'unidad' : 'unidades'} por
                                  reponer
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-medium text-brand-neutral-900 dark:text-brand-neutral-100">
                              {formatCOP(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* The coupon that produced this total. Without it the
                          sum of the lines does not reconcile with the amount
                          charged, which is exactly the kind of gap the client
                          audits against. */}
                      {order.couponCode && (
                        <p className="mb-3 flex items-center gap-1.5 font-sans text-xs text-brand-neutral-500">
                          <Ticket className="size-3.5 shrink-0" aria-hidden="true" />
                          Cupón {order.couponCode}
                          {order.couponDiscountAmount !== null && (
                            <> · −{formatCOP(order.couponDiscountAmount)}</>
                          )}
                        </p>
                      )}

                      {/*
                        The single most important thing for the client to
                        understand about the new model: the units are ALREADY
                        out of inventory. Without saying so, "confirm" looks
                        like the step that reserves them and rejecting looks
                        free — and the stock number they see on the product
                        list would seem wrong by exactly this order.
                      */}
                      {order.status === 'PENDING_WHATSAPP' && (
                        <p className="mb-3 rounded-md bg-brand-neutral-50 px-3 py-2 font-sans text-xs text-brand-neutral-600 dark:bg-brand-neutral-800/40 dark:text-brand-neutral-300">
                          El stock de este pedido ya está reservado (se descontó al
                          hacerse el pedido). Confirmar no descuenta nada de nuevo;
                          rechazar devuelve las unidades al inventario.
                        </p>
                      )}

                      {/* Historical orders only — no new order can carry a
                          sobrepedido, so this is read-only context now. */}
                      {order.status === 'PENDING_WHATSAPP' && showsBackorder && (
                        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 font-sans text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
                          Este pedido antiguo registra {backordered}{' '}
                          {backordered === 1 ? 'unidad' : 'unidades'} de sobrepedido
                          pendientes de reponer.
                        </p>
                      )}

                      {order.status === 'PENDING_WHATSAPP' && (
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={processingId === order.id}
                            onClick={() => handleReject(order)}
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
                            {/* Was "Confirmar (descuenta stock)". It no longer
                                descuenta anything — creation did. */}
                            {processingId === order.id ? 'Procesando…' : 'Confirmar pedido'}
                          </Button>
                        </div>
                      )}

                      {/*
                        Rejected orders only. They used to have no action at all
                        and simply piled up; a confirmed order, by contrast, is
                        an accounting record with stock deducted against it and
                        stays put. The server enforces the same scope.
                      */}
                      {order.status === 'REJECTED' && (
                        <div className="flex justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={processingId === order.id}
                            onClick={() => handleDelete(order)}
                            className="flex items-center gap-1.5 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="size-3.5" />
                            {processingId === order.id ? 'Eliminando…' : 'Eliminar pedido'}
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
