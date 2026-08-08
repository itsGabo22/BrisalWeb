'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Star, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Stars } from '@/components/ui/star-rating';

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  imageUrls: string[];
  status: ReviewStatus;
  createdAt: string;
}

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

const TABS: { key: Tab; label: string }[] = [
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'APPROVED', label: 'Aprobadas' },
  { key: 'REJECTED', label: 'Rechazadas' },
  { key: 'ALL', label: 'Todas' },
];

const STATUS_BADGE: Record<ReviewStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
  },
  APPROVED: {
    label: 'Aprobada',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rechazada',
    className: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400',
  },
};

export default function AdminResenasPage() {
  const [reviews, setReviews] = React.useState<AdminReview[]>([]);
  const [counts, setCounts] = React.useState<Record<Tab, number>>({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    ALL: 0,
  });
  // Pendientes first: this page exists to be a to-do list.
  const [activeTab, setActiveTab] = React.useState<Tab>('PENDING');
  const [isLoading, setIsLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (tab: Tab, showSpinner = false) => {
    // Set inside the async body rather than in the effect: React flags a
    // synchronous setState in an effect as a cascading render.
    if (showSpinner) setIsLoading(true);
    try {
      const query = tab === 'ALL' ? '' : `?status=${tab}`;
      const res = await fetch(`/api/admin/resenas${query}`);
      if (!res.ok) throw new Error('No se pudieron cargar las reseñas');
      const data = (await res.json()) as {
        reviews: AdminReview[];
        counts: Record<Tab, number>;
      };
      setReviews(data.reviews);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => load(activeTab, true));
  }, [activeTab, load]);

  const moderate = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/resenas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'No se pudo procesar la reseña');
      }
      await load(activeTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña definitivamente? También se borran sus fotos.')) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/resenas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar la reseña');
      await load(activeTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="font-sans text-sm text-brand-neutral-500">
        Las reseñas nuevas quedan ocultas hasta que las apruebes.
      </p>

      <div className="flex flex-wrap border-b border-brand-neutral-200 font-sans text-sm dark:border-brand-neutral-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 font-medium transition-all ${
              activeTab === tab.key
                ? 'border-brand-gold font-semibold text-brand-gold'
                : 'border-transparent text-brand-neutral-500 hover:text-brand-neutral-800 dark:hover:text-brand-neutral-250'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                // Pending is the only count that means "you have work to do", so
                // it stays red even when the tab isn't selected.
                tab.key === 'PENDING' && counts.PENDING > 0
                  ? 'bg-red-500 text-white'
                  : activeTab === tab.key
                    ? 'bg-brand-gold/15 text-brand-gold'
                    : 'bg-brand-neutral-100 text-brand-neutral-500 dark:bg-brand-neutral-900'
              }`}
            >
              {counts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950/20 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-brand-neutral-200 bg-white font-sans text-sm text-brand-neutral-400 dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
          <Star className="size-6 text-brand-neutral-300" />
          <p>
            {activeTab === 'PENDING'
              ? 'No hay reseñas por moderar. Todo al día.'
              : 'No hay reseñas en esta sección.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const badge = STATUS_BADGE[review.status];
            const isBusy = busyId === review.id;

            return (
              <li
                key={review.id}
                className="rounded-xl border border-brand-neutral-200 bg-white p-4 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Product identity: the client has to know WHAT is being
                      reviewed before they can judge whether it's genuine. */}
                  <Link
                    href={`/producto/${review.productSlug}`}
                    target="_blank"
                    className="flex shrink-0 items-center gap-3 sm:w-52"
                  >
                    <span className="size-12 shrink-0 overflow-hidden rounded-md border border-brand-neutral-200 bg-brand-neutral-50 dark:border-brand-neutral-800">
                      {review.productImageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={review.productImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 font-sans text-xs">
                      <span className="flex items-center gap-1 font-semibold text-brand-neutral-800 dark:text-brand-neutral-200">
                        <span className="truncate">{review.productName}</span>
                        <ExternalLink className="size-3 shrink-0 text-brand-neutral-400" />
                      </span>
                      <span className="mt-0.5 block text-brand-neutral-400">
                        {new Date(review.createdAt).toLocaleDateString('es-CO')}
                      </span>
                    </span>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars value={review.rating} size="sm" />
                      <span className="font-sans text-sm font-semibold text-brand-neutral-900 dark:text-brand-neutral-100">
                        {review.authorName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {review.title && (
                      <p className="mt-1.5 font-sans text-sm font-medium text-brand-neutral-800 dark:text-brand-neutral-200">
                        {review.title}
                      </p>
                    )}
                    {review.body && (
                      <p className="mt-1 font-sans text-sm leading-relaxed whitespace-pre-line text-brand-neutral-600 dark:text-brand-neutral-400">
                        {review.body}
                      </p>
                    )}

                    {review.imageUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {review.imageUrls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="size-16 overflow-hidden rounded-md border border-brand-neutral-200 transition-opacity hover:opacity-80 dark:border-brand-neutral-800"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-row items-start gap-2 sm:flex-col">
                    {review.status !== 'APPROVED' && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => moderate(review.id, 'approve')}
                        className="flex items-center gap-1.5"
                      >
                        <Check className="size-3.5" />
                        Aprobar
                      </Button>
                    )}
                    {review.status !== 'REJECTED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => moderate(review.id, 'reject')}
                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700"
                      >
                        <X className="size-3.5" />
                        Rechazar
                      </Button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => remove(review.id)}
                      aria-label="Eliminar reseña"
                      className="flex size-8 items-center justify-center rounded-md text-brand-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
