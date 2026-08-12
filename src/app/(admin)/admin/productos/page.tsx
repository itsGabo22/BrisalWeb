'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  EyeOff,
  PackageX,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { formatCOP } from '@/lib/utils/pricing';
import { resolveProductImageUrl } from '@/lib/utils/product-images';
import { getProductReference } from '@/lib/utils/product-reference';
import { getSelectableColors } from '@/lib/utils/product-options';
import type { Category, Product } from '@/types';
import { Button } from '@/components/ui/button';

/** Quick date windows, in days. `null` is "any date". */
const DATE_RANGES = [
  { value: 'all', label: 'Cualquier fecha', days: null },
  { value: '7', label: 'Últimos 7 días', days: 7 },
  { value: '30', label: 'Últimos 30 días', days: 30 },
  { value: '90', label: 'Últimos 90 días', days: 90 },
] as const;

type DateRange = (typeof DATE_RANGES)[number]['value'];
type StatusFilter = 'all' | 'activo' | 'agotado' | 'inactivo';

/**
 * Total units across every colour a product sells in.
 *
 * `product.stock` alone is only the PRIMARY colour's — a product whose primary
 * colour is sold out but which still has stock in two variants is not
 * "Agotado", and saying so would pull a sellable piece out of the list.
 */
function getTotalStock(product: Product): number {
  const colors = getSelectableColors(product);
  // A product with no colour data at all keeps its own stock as the total.
  if (colors.length === 0) return product.stock;
  return colors.reduce((sum, color) => sum + color.stock, 0);
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export default function AdminProductosPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  /**
   * The window and the instant it was measured from, together.
   *
   * `cutoff` is computed in the change handler rather than during render:
   * reading the clock while rendering makes the result depend on WHEN React
   * happens to re-render, so a row could silently drop out of "últimos 7 días"
   * mid-session. Pinning it at the moment of choice also matches what the admin
   * expects — the list holds still until they ask for something else.
   */
  const [dateFilter, setDateFilter] = React.useState<{
    value: DateRange;
    cutoff: number | null;
  }>({ value: 'all', cutoff: null });
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [expandedIds, setExpandedIds] = React.useState<string[]>([]);

  const toggleExpanded = (id: string) =>
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const loadProducts = React.useCallback(async () => {
    try {
      const [prodRes, catsRes] = await Promise.all([
        fetch('/api/admin/productos'),
        fetch('/api/admin/categorias'),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadProducts());
  }, [loadProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/productos/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        return;
      }

      const data = await res.json().catch(() => null);
      alert(data?.error ?? 'Error al eliminar producto');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error de conexión al eliminar el producto');
    }
  };

  /**
   * AND across the four dimensions. Computed during render rather than held in
   * state: every input already lives in state, so a derived list cannot drift
   * out of sync with them.
   */
  const filteredProducts = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const cutoff = dateFilter.cutoff;

    return products.filter((product) => {
      if (
        term &&
        !product.name.toLowerCase().includes(term) &&
        !(product.category?.name || '').toLowerCase().includes(term)
      ) {
        return false;
      }

      // Matches the category itself or its parent, so picking a root category
      // also shows everything filed under its subcategories.
      if (
        categoryFilter !== 'all' &&
        product.categoryId !== categoryFilter &&
        product.category?.parentId !== categoryFilter
      ) {
        return false;
      }

      if (cutoff !== null && new Date(product.createdAt).getTime() < cutoff) {
        return false;
      }

      if (statusFilter !== 'all') {
        const soldOut = getTotalStock(product) === 0;
        if (statusFilter === 'inactivo' && product.active) return false;
        if (statusFilter === 'agotado' && (!product.active || !soldOut)) return false;
        if (statusFilter === 'activo' && (!product.active || soldOut)) return false;
      }

      return true;
    });
  }, [products, search, categoryFilter, dateFilter, statusFilter]);

  const hasFilters =
    search.trim() !== '' ||
    categoryFilter !== 'all' ||
    dateFilter.value !== 'all' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setDateFilter({ value: 'all', cutoff: null });
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-neutral-400" />
          <input
            type="text"
            placeholder="Buscar productos por nombre o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-brand-neutral-200 bg-white pl-10 pr-4 py-2 font-sans text-sm text-brand-neutral-800 placeholder-brand-neutral-400 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-900 dark:text-brand-neutral-100"
          />
        </div>

        <Link href="/admin/productos/nuevo" passHref>
          <Button className="flex items-center gap-2">
            <Plus className="size-4" />
            <span>Nuevo Producto</span>
          </Button>
        </Link>
      </div>

      {/* Filters. Plain selects rather than a date picker widget: the client
          asked to find recent products, and three fixed windows answer that
          without a calendar to learn. */}
      <div className="flex flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-4 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex-1">
          <label
            htmlFor="filter-categoria"
            className="mb-1 block font-sans text-xs font-medium uppercase tracking-wider text-brand-neutral-500"
          >
            Categoría
          </label>
          <select
            id="filter-categoria"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-md border border-brand-neutral-200 bg-white px-3 py-2 font-sans text-sm text-brand-neutral-800 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.parentId ? `└─ ${cat.name}` : cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label
            htmlFor="filter-fecha"
            className="mb-1 block font-sans text-xs font-medium uppercase tracking-wider text-brand-neutral-500"
          >
            Fecha de creación
          </label>
          <select
            id="filter-fecha"
            value={dateFilter.value}
            onChange={(e) => {
              const value = e.target.value as DateRange;
              const days = DATE_RANGES.find((r) => r.value === value)?.days ?? null;
              setDateFilter({
                value,
                cutoff: days === null ? null : Date.now() - days * 24 * 60 * 60 * 1000,
              });
            }}
            className="w-full rounded-md border border-brand-neutral-200 bg-white px-3 py-2 font-sans text-sm text-brand-neutral-800 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
          >
            {DATE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label
            htmlFor="filter-estado"
            className="mb-1 block font-sans text-xs font-medium uppercase tracking-wider text-brand-neutral-500"
          >
            Estado
          </label>
          <select
            id="filter-estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full rounded-md border border-brand-neutral-200 bg-white px-3 py-2 font-sans text-sm text-brand-neutral-800 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
          >
            <option value="all">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="agotado">Agotado</option>
            <option value="inactivo">Inactivo (oculto)</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 rounded-md px-3 py-2 font-sans text-sm text-brand-neutral-500 underline underline-offset-4 transition-colors hover:text-brand-gold"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-brand-neutral-200 bg-white overflow-hidden shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 font-sans text-brand-neutral-500">
            <p className="text-lg">No se encontraron productos.</p>
            <p className="text-sm text-brand-neutral-400">
              {hasFilters
                ? 'Prueba con otros filtros o límpialos.'
                : 'Crea tu primer producto para verlo aquí.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-brand-neutral-100 dark:border-brand-neutral-800 bg-brand-neutral-50 dark:bg-brand-neutral-950 text-xs font-semibold uppercase tracking-wider text-brand-neutral-500 dark:text-brand-neutral-400">
                  <th className="px-6 py-4">Imagen</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Creado</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-100 dark:divide-brand-neutral-800">
                {filteredProducts.map((product) => {
                  const colors = getSelectableColors(product);
                  const isExpanded = expandedIds.includes(product.id);
                  const totalStock = getTotalStock(product);
                  const isSoldOut = totalStock === 0;

                  return (
                  <React.Fragment key={product.id}>
                  <tr className="hover:bg-brand-neutral-50/50 dark:hover:bg-brand-neutral-800/20 transition-colors">
                    {/* Image + expander */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Only products that actually have colours can expand;
                            a chevron on a colourless product would open an
                            empty drawer. */}
                        {colors.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(product.id)}
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded ? 'Ocultar colores' : 'Ver colores'
                            }
                            className="text-brand-neutral-400 transition-colors hover:text-brand-gold"
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                        ) : (
                          <span className="size-4" />
                        )}
                        <div className="relative size-12 overflow-hidden rounded-md border border-brand-neutral-100 bg-brand-neutral-50 dark:border-brand-neutral-800 dark:bg-brand-neutral-950">
                          {product.imageUrls?.[0] ? (
                            <Image
                              src={resolveProductImageUrl(product.imageUrls[0])}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-brand-neutral-400">
                              Sin img
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Name / SKU */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-neutral-900 dark:text-brand-neutral-100 text-sm">
                        {product.name}
                      </div>
                      <div className="text-xs text-brand-neutral-400 dark:text-brand-neutral-500">
                        Ref: {getProductReference(product)}
                      </div>
                      {/* Makes it obvious at a glance which products carry
                          colours, and how many, without opening the editor. */}
                      {product.colorVariants.length > 0 && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="flex items-center gap-0.5">
                            {product.colorVariants.slice(0, 5).map((variant) => (
                              <span
                                key={variant.id}
                                title={variant.colorName}
                                className="size-3 rounded-full border border-brand-neutral-200 dark:border-brand-neutral-700"
                                style={{ backgroundColor: variant.colorHex }}
                              />
                            ))}
                          </span>
                          <span className="text-[11px] text-brand-neutral-500">
                            {product.colorVariants.length}{' '}
                            {product.colorVariants.length === 1 ? 'color' : 'colores'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-sm text-brand-neutral-600 dark:text-brand-neutral-300">
                      {product.category?.name || 'Sin Categoría'}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-sm font-semibold text-brand-neutral-900 dark:text-brand-neutral-100">
                      {formatCOP(product.price)}
                    </td>

                    {/* Stock — the total across every colour, which is what
                        "Agotado" is judged on. */}
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-semibold ${isSoldOut ? 'text-red-500' : 'text-brand-neutral-700 dark:text-brand-neutral-300'}`}>
                        {totalStock}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-brand-neutral-600 dark:text-brand-neutral-300">
                      {DATE_FORMATTER.format(new Date(product.createdAt))}
                    </td>

                    {/*
                      Two real states, plus the hidden case:
                        • Activo   — on sale and in stock
                        • Agotado  — DERIVED from stock, never stored
                        • Inactivo — `active: false`, i.e. hidden from the shop
                      There is no "Borrador": nothing in the data model has ever
                      represented an unfinished product.
                    */}
                    <td className="px-6 py-4 text-sm">
                      {!product.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-neutral-100 px-2 py-1 text-xs font-medium text-brand-neutral-600 dark:bg-brand-neutral-800 dark:text-brand-neutral-300">
                          <EyeOff className="size-3" />
                          Inactivo
                        </span>
                      ) : isSoldOut ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-300 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800">
                          <PackageX className="size-3" />
                          Agotado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Activo
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/productos/${product.id}`} passHref>
                          <button
                            className="p-1 text-brand-neutral-500 hover:text-brand-gold transition-colors"
                            aria-label="Editar producto"
                          >
                            <Edit className="size-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1 text-brand-neutral-500 hover:text-red-500 transition-colors"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Per-colour sub-rows: primary first, then the additional
                      colours, so all stock and pricing is visible without
                      opening each product's edit form. */}
                  {isExpanded &&
                    colors.map((color) => (
                      <tr
                        key={`${product.id}-${color.id}`}
                        className="bg-brand-neutral-50/60 text-sm dark:bg-brand-neutral-950/40"
                      >
                        <td className="px-6 py-2" />
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-4 shrink-0 rounded-full border border-brand-neutral-200 dark:border-brand-neutral-700"
                              style={{ backgroundColor: color.colorHex }}
                              aria-hidden="true"
                            />
                            <span className="text-brand-neutral-800 dark:text-brand-neutral-200">
                              {color.colorName}
                            </span>
                            {color.isPrimary && (
                              <span className="rounded-full bg-brand-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-gold-deep">
                                Principal
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-2 text-xs text-brand-neutral-500">
                          {color.reference}
                        </td>
                        <td className="px-6 py-2 text-brand-neutral-700 dark:text-brand-neutral-300">
                          {formatCOP(color.price)}
                          {/* A variant with no price of its own follows the
                              product's — say so rather than showing a number
                              the client didn't type. */}
                          {!color.isPrimary && color.variant?.price == null && (
                            <span className="ml-1 text-[11px] text-brand-neutral-400">
                              (hereda)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2">
                          <span
                            className={
                              color.stock === 0
                                ? 'text-red-500'
                                : 'text-brand-neutral-700 dark:text-brand-neutral-300'
                            }
                          >
                            {color.stock}
                          </span>
                        </td>
                        {/* Creado / Estado / Acciones belong to the product row,
                            not to each colour. */}
                        <td className="px-6 py-2" colSpan={3} />
                      </tr>
                    ))}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
