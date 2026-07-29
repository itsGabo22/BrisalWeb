'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

import { formatCOP } from '@/lib/utils/pricing';
import { resolveProductImageUrl } from '@/lib/utils/product-images';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEBOUNCE_MS = 300;

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
    void Promise.resolve().then(() => {
      setQuery('');
      setResults([]);
      setTotal(0);
    });
  }, [isOpen]);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      void Promise.resolve().then(() => {
        setResults([]);
        setTotal(0);
        setIsLoading(false);
      });
      return;
    }

    void Promise.resolve().then(() => setIsLoading(true));
    const timer = setTimeout(() => {
      void Promise.resolve()
        .then(() => fetch(`/api/productos/buscar?q=${encodeURIComponent(trimmed)}`))
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { products: SearchResult[]; total: number } | null) => {
          setResults(data?.products ?? []);
          setTotal(data?.total ?? 0);
        })
        .catch(() => {
          setResults([]);
          setTotal(0);
        })
        .finally(() => setIsLoading(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const goToFullResults = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToFullResults();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col bg-brand-pearl/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Buscar"
        >
          <div
            className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 pb-6 sm:px-6"
            style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-semibold text-brand-neutral-900">
                Buscar
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar búsqueda"
                className="flex h-11 w-11 items-center justify-center rounded-full text-brand-neutral-600 transition-colors active:scale-95 hover:bg-brand-gold/10 hover:text-brand-gold"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand-neutral-400"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar accesorios, categorías…"
                  aria-label="Buscar accesorios, categorías"
                  className="w-full rounded-full border border-brand-neutral-200 bg-white py-4 pl-12 pr-4 font-sans text-base text-brand-neutral-900 placeholder:text-brand-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </div>
            </form>

            <div className="mt-6 flex-1 overflow-y-auto">
              {!query.trim() ? (
                <p className="py-12 text-center font-sans text-sm text-brand-neutral-400">
                  Escribe algo para buscar.
                </p>
              ) : isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
                </div>
              ) : results.length === 0 ? (
                <p className="py-12 text-center font-sans text-sm text-brand-neutral-400">
                  No encontramos productos para “{query.trim()}”.
                </p>
              ) : (
                <ul className="space-y-1">
                  {results.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/producto/${product.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-white"
                      >
                        <Image
                          src={resolveProductImageUrl(product.imageUrl)}
                          alt={product.name}
                          width={56}
                          height={56}
                          className="size-14 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sans text-sm font-medium text-brand-neutral-900">
                            {product.name}
                          </p>
                          <p className="font-sans text-sm text-brand-gold">
                            {formatCOP(product.price)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                  {total > results.length && (
                    <li className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={goToFullResults}
                        className="font-sans text-sm font-semibold text-brand-gold hover:underline"
                      >
                        Ver los {total} resultados
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
