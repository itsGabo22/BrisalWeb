'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { formatCOP } from '@/lib/utils/pricing';
import { resolveProductImageUrl } from '@/lib/utils/product-images';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';

export default function AdminProductosPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [search, setSearch] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  const loadProducts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/productos');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
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
      } else {
        alert('Error al eliminar producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name || '').toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Table Container */}
      <div className="rounded-xl border border-brand-neutral-200 bg-white overflow-hidden shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 font-sans text-brand-neutral-500">
            <p className="text-lg">No se encontraron productos.</p>
            <p className="text-sm text-brand-neutral-400">Intenta cambiar el término de búsqueda.</p>
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
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-neutral-100 dark:divide-brand-neutral-800">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-brand-neutral-50/50 dark:hover:bg-brand-neutral-800/20 transition-colors">
                    {/* Image */}
                    <td className="px-6 py-4">
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
                    </td>

                    {/* Name / SKU */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-brand-neutral-900 dark:text-brand-neutral-100 text-sm">
                        {product.name}
                      </div>
                      {product.sku && (
                        <div className="text-xs text-brand-neutral-400 dark:text-brand-neutral-500">
                          SKU: {product.sku}
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

                    {/* Stock */}
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : 'text-brand-neutral-700 dark:text-brand-neutral-300'}`}>
                        {product.stock}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 text-sm">
                      {product.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
                          <XCircle className="size-3" />
                          Borrador
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
