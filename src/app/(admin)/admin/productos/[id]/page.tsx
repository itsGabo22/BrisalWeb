'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Save,
  CheckCircle,
  Images,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types';
import {
  ColorVariantsSection,
  makeVariantDraft,
  type VariantDraft,
} from '@/components/admin/ColorVariantsSection';
import { Button } from '@/components/ui/button';

interface BandejaImage {
  id: string;
  url: string;
  filename: string;
  assigned: boolean;
}

interface PendingAssignment {
  imageId: string;
  url: string;
}

export default function AdminProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'nuevo';

  // Categories list for select dropdown
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingCats, setIsLoadingCats] = React.useState(true);

  // Form states
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState<number>(0);
  const [comparePrice, setComparePrice] = React.useState<number | null>(null);
  const [wholesalePrice, setWholesalePrice] = React.useState<number | null>(null);
  const [categoryId, setCategoryId] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [stock, setStock] = React.useState<number>(0);
  const [material, setMaterial] = React.useState('');
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [featured, setFeatured] = React.useState(false);
  const [active, setActive] = React.useState(true);
  
  // Variants state
  const [colorVariants, setColorVariants] = React.useState<VariantDraft[]>([]);
  const [description, setDescription] = React.useState('');

  // Custom attributes state

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Load product if editing
  React.useEffect(() => {
    async function loadData() {
      try {
        // Fetch categories first
        const catsRes = await fetch('/api/admin/categorias');
        if (catsRes.ok) {
          const catsData = await catsRes.json();
          setCategories(catsData);
        }

        if (!isNew) {
          const prodRes = await fetch(`/api/admin/productos/${id}`);
          if (prodRes.ok) {
            const prod = await prodRes.json();
            setName(prod.name);
            setPrice(prod.price);
            setComparePrice(prod.comparePrice);
            setWholesalePrice(prod.wholesalePrice ?? null);
            setCategoryId(prod.categoryId);
            setSku(prod.sku || '');
            setStock(prod.stock);
            setMaterial(prod.material || '');
            setImageUrls(prod.imageUrls || []);
            setFeatured(prod.featured);
            setActive(prod.active);
            setDescription(prod.description || '');
            // Stored variants become drafts: prices back to text so a blank
            // box keeps meaning "inherit" rather than turning into 0.
            setColorVariants(
              (prod.colorVariants || []).map(
                (variant: {
                  colorName: string;
                  colorHex: string;
                  imageUrls: string[];
                  price: number | null;
                  wholesalePrice: number | null;
                  stock: number;
                }) => ({
                  ...makeVariantDraft(),
                  colorName: variant.colorName,
                  colorHex: variant.colorHex,
                  imageUrls: variant.imageUrls ?? [],
                  price: variant.price === null ? '' : String(variant.price),
                  wholesalePrice:
                    variant.wholesalePrice === null ? '' : String(variant.wholesalePrice),
                  stock: variant.stock,
                }),
              ),
            );
          } else {
            setError('Producto no encontrado');
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al conectar con el servidor');
      } finally {
        setIsLoadingCats(false);
      }
    }

    loadData();
  }, [id, isNew]);

  // Images: bandeja picker + direct upload
  const [imageTab, setImageTab] = React.useState<'bandeja' | 'subir'>('bandeja');
  const [bandejaImages, setBandejaImages] = React.useState<BandejaImage[]>([]);
  const [isLoadingBandeja, setIsLoadingBandeja] = React.useState(false);
  const [selectedBandejaIds, setSelectedBandejaIds] = React.useState<string[]>([]);
  const [pendingAssignments, setPendingAssignments] = React.useState<PendingAssignment[]>([]);
  const [isUploadingSingle, setIsUploadingSingle] = React.useState(false);
  const [imagesError, setImagesError] = React.useState<string | null>(null);

  const loadBandeja = React.useCallback(async () => {
    setIsLoadingBandeja(true);
    try {
      const res = await fetch('/api/admin/imagenes?assigned=false&page=1');
      if (res.ok) {
        const data = await res.json();
        setBandejaImages(data.images);
      }
    } catch (err) {
      console.error('Error loading bandeja:', err);
    } finally {
      setIsLoadingBandeja(false);
    }
  }, []);

  React.useEffect(() => {
    if (imageTab === 'bandeja') void Promise.resolve().then(() => loadBandeja());
  }, [imageTab, loadBandeja]);

  const toggleBandejaSelect = (imageId: string) => {
    setSelectedBandejaIds((prev) => {
      if (prev.includes(imageId)) return prev.filter((selectedId) => selectedId !== imageId);
      if (prev.length >= 3) return prev;
      return [...prev, imageId];
    });
  };

  const handleUseSelected = () => {
    const selected = bandejaImages.filter((img) => selectedBandejaIds.includes(img.id));
    setImageUrls((prev) => [...prev, ...selected.map((img) => img.url)]);
    setPendingAssignments((prev) => [
      ...prev,
      ...selected.map((img) => ({ imageId: img.id, url: img.url })),
    ]);
    setBandejaImages((prev) => prev.filter((img) => !selectedBandejaIds.includes(img.id)));
    setSelectedBandejaIds([]);
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagesError(null);
    setIsUploadingSingle(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/imagenes/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? 'Error al subir la imagen');
      }
      const uploaded = (await res.json()) as { id: string; url: string };
      setImageUrls((prev) => [...prev, uploaded.url]);
      setPendingAssignments((prev) => [...prev, { imageId: uploaded.id, url: uploaded.url }]);
    } catch (err) {
      setImagesError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setIsUploadingSingle(false);
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    const removedUrl = imageUrls[indexToRemove];
    setImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
    setPendingAssignments((prev) => prev.filter((p) => p.url !== removedUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    // Dynamic slug helper
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const productPayload = {
      name,
      slug,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
      categoryId,
      sku: sku.trim() || null,
      stock: Number(stock),
      material: material.trim() || null,
      description: description.trim() || null,
      imageUrls,
      featured,
      active,
      // Blank price boxes become null = "inherit the product price", which is
      // what resolveVariantPricing reads. Sending 0 would mean free.
      colorVariants: colorVariants
        .filter((variant) => variant.colorName.trim())
        .map((variant, index) => ({
          colorName: variant.colorName.trim(),
          colorHex: variant.colorHex,
          imageUrls: variant.imageUrls,
          price: variant.price.trim() === '' ? null : Number(variant.price),
          wholesalePrice:
            variant.wholesalePrice.trim() === '' ? null : Number(variant.wholesalePrice),
          stock: variant.stock,
          order: index,
        })),
    };

    try {
      const url = isNew ? '/api/admin/productos' : `/api/admin/productos/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar el producto');
      }

      const savedProduct = (await res.json()) as { id: string };

      if (pendingAssignments.length > 0) {
        await Promise.all(
          pendingAssignments.map(({ imageId }) =>
            fetch(`/api/admin/imagenes/${imageId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: savedProduct.id }),
            }),
          ),
        );
      }

      setSuccessMsg(isNew ? 'Producto creado con éxito' : 'Producto actualizado con éxito');
      setTimeout(() => {
        router.push('/admin/productos');
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-2 font-sans text-sm text-brand-neutral-500 hover:text-brand-neutral-900 dark:hover:text-brand-neutral-200 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Volver a la lista</span>
        </Link>

        <span className="font-serif text-sm text-brand-gold tracking-wider uppercase font-semibold">
          {isNew ? 'Nuevo Accesorio' : 'Edición de Accesorio'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 font-sans">
        {/* Alerts */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle className="size-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: General Info */}
        <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
          <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 mb-4">
            Información General
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Anillo Sello Baño de Oro"
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Precio (COP) *
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Precio Comparativo / Anterior (COP)
              </label>
              <input
                type="number"
                value={comparePrice || ''}
                onChange={(e) => setComparePrice(e.target.value ? Number(e.target.value) : null)}
                placeholder="Opcional"
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Precio Mayorista (COP)
              </label>
              <input
                type="number"
                value={wholesalePrice || ''}
                onChange={(e) => setWholesalePrice(e.target.value ? Number(e.target.value) : null)}
                placeholder="Opcional — visible solo para mayoristas aprobados"
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Categoría *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? `└─ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Materiales
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Ej. Baño de oro 24k"
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="product-description"
                className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1"
              >
                Descripción
              </label>
              <textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe la pieza: acabado, medidas, ocasión…"
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
              <p className="mt-1 text-xs text-brand-neutral-400">
                Opcional. Si la dejas vacía, la sección no aparece en la página del
                producto.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Image Uploader */}
        <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
          <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 mb-1 flex items-center gap-2">
            <Images className="size-5 text-brand-gold" />
            <span>Imágenes del Producto</span>
          </h2>
          <p className="text-xs text-brand-neutral-400 mb-4">
            Selecciona imágenes desde la bandeja o sube una nueva directamente.
          </p>

          {/* Selected images preview */}
          {imageUrls.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              {imageUrls.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative aspect-square rounded-lg border border-brand-neutral-200 overflow-hidden group dark:border-brand-neutral-800"
                >
                  <Image
                    src={url}
                    alt={`Previsualización ${idx + 1}`}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    aria-label="Quitar imagen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-brand-neutral-200 dark:border-brand-neutral-800 mb-4 text-sm font-sans">
            <button
              type="button"
              onClick={() => setImageTab('bandeja')}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors ${
                imageTab === 'bandeja'
                  ? 'border-brand-gold text-brand-gold'
                  : 'border-transparent text-brand-neutral-500 hover:text-brand-neutral-800 dark:hover:text-brand-neutral-250'
              }`}
            >
              <Images className="size-4" />
              Desde bandeja
            </button>
            <button
              type="button"
              onClick={() => setImageTab('subir')}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors ${
                imageTab === 'subir'
                  ? 'border-brand-gold text-brand-gold'
                  : 'border-transparent text-brand-neutral-500 hover:text-brand-neutral-800 dark:hover:text-brand-neutral-250'
              }`}
            >
              <Upload className="size-4" />
              Subir nueva
            </button>
          </div>

          {imagesError && (
            <p className="mb-3 text-xs text-red-500" role="alert">
              {imagesError}
            </p>
          )}

          {imageTab === 'bandeja' ? (
            <div>
              {isLoadingBandeja ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
                </div>
              ) : bandejaImages.length === 0 ? (
                <p className="text-xs text-brand-neutral-400">
                  No hay imágenes disponibles en la bandeja.{' '}
                  <Link href="/admin/imagenes" className="text-brand-gold hover:underline">
                    Subir imágenes
                  </Link>
                </p>
              ) : (
                <>
                  <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-6">
                    {bandejaImages.map((img) => {
                      const isSelected = selectedBandejaIds.includes(img.id);
                      return (
                        <button
                          type="button"
                          key={img.id}
                          onClick={() => toggleBandejaSelect(img.id)}
                          className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                            isSelected
                              ? 'border-brand-gold'
                              : 'border-transparent hover:border-brand-neutral-300'
                          }`}
                        >
                          <Image
                            src={img.url}
                            alt={img.filename}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                          {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center bg-brand-gold/40">
                              <Check className="size-6 text-white" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-brand-neutral-400">
                      {selectedBandejaIds.length}/3 seleccionadas
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={selectedBandejaIds.length === 0}
                      onClick={handleUseSelected}
                    >
                      Usar seleccionadas
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-brand-neutral-300 rounded-lg p-6 hover:border-brand-gold cursor-pointer transition-colors dark:border-brand-neutral-800">
              {isUploadingSingle ? (
                <Loader2 className="size-6 text-brand-gold mb-2 animate-spin" />
              ) : (
                <Upload className="size-6 text-brand-neutral-400 mb-2" />
              )}
              <span className="text-xs font-semibold text-brand-neutral-600 dark:text-brand-neutral-400">
                {isUploadingSingle ? 'Subiendo…' : 'Seleccionar foto'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleSingleUpload}
                disabled={isUploadingSingle}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Section 3: Inventory & Toggles */}
        <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
          <h2 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 mb-4">
            Inventario y Estados
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Stock Total *
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300 mb-1">
                Código SKU (Referencia)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. BSR-ANI-001"
                className="w-full rounded-md border border-brand-neutral-200 bg-white px-4 py-2 text-brand-neutral-800 dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            {/* Checkboxes */}
            <div className="sm:col-span-2 flex flex-col gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-brand-neutral-300 text-brand-gold focus:ring-brand-gold size-4"
                />
                <span className="text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300">
                  Producto Activo (Visible en el catálogo de clientes)
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-brand-neutral-300 text-brand-gold focus:ring-brand-gold size-4"
                />
                <span className="text-sm font-medium text-brand-neutral-700 dark:text-brand-neutral-300">
                  Destacar Producto (Mostrar en carruseles principales)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Colores / Variantes */}
        <ColorVariantsSection variants={colorVariants} onChange={setColorVariants} />

        {/* Sticky Mobile/Desktop Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 border-t border-brand-neutral-200 bg-white/80 dark:border-brand-neutral-800 dark:bg-brand-neutral-900/80 backdrop-blur-md p-4 flex items-center justify-between z-30 transition-all">
          <Link href="/admin/productos" passHref>
            <Button variant="secondary" className="px-6 py-2">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || !name || !categoryId || price <= 0}
            className="flex items-center gap-2 px-8 py-2"
          >
            <Save className="size-4" />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
