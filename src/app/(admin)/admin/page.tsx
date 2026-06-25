'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  FolderTree,
  Percent,
  Users,
  ArrowRight,
  TrendingUp,
  Plus,
} from 'lucide-react';

import type { Discount, Wholesaler } from '@/types';

interface Stats {
  productsCount: number;
  categoriesCount: number;
  discountsCount: number;
  wholesalersPendingCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<Stats>({
    productsCount: 0,
    categoriesCount: 0,
    discountsCount: 0,
    wholesalersPendingCount: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      try {
        const [resProds, resCats, resDiscs, resWholesales] = await Promise.all([
          fetch('/api/admin/productos'),
          fetch('/api/admin/categorias'),
          fetch('/api/admin/descuentos'),
          fetch('/api/admin/mayoristas'),
        ]);

        if (resProds.ok && resCats.ok && resDiscs.ok && resWholesales.ok) {
          const prods = await resProds.json();
          const cats = await resCats.json();
          const discs = await resDiscs.json();
          const wholesales = await resWholesales.json();

          setStats({
            productsCount: prods.length,
            categoriesCount: cats.length,
            discountsCount: discs.filter((d: Discount) => d.active).length,
            wholesalersPendingCount: wholesales.filter(
              (w: Wholesaler) => w.estado === 'PENDIENTE'
            ).length,
          });
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const cards = [
    {
      title: 'Productos en Catálogo',
      value: stats.productsCount,
      description: 'Productos gestionados',
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/admin/productos',
    },
    {
      title: 'Categorías',
      value: stats.categoriesCount,
      description: 'Estructura de catálogo',
      icon: FolderTree,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      link: '/admin/categorias',
    },
    {
      title: 'Campañas de Descuento',
      value: stats.discountsCount,
      description: 'Descuentos activos',
      icon: Percent,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      link: '/admin/descuentos',
    },
    {
      title: 'Solicitudes Mayoristas',
      value: stats.wholesalersPendingCount,
      description: 'Pendientes por revisar',
      icon: Users,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold/10',
      link: '/admin/mayoristas',
      highlight: stats.wholesalersPendingCount > 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 transition-colors">
        <h2 className="font-serif text-2xl font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
          ¡Hola de nuevo, Administrador!
        </h2>
        <p className="font-sans text-sm text-brand-neutral-500 dark:text-brand-neutral-400 mt-1">
          Aquí tienes un resumen general del estado de tu catálogo virtual de accesorios premium.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.link}
              className={`block group rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm hover:border-brand-gold hover:shadow-md transition-all dark:border-brand-neutral-800 dark:bg-brand-neutral-900 ${
                card.highlight ? 'ring-2 ring-brand-gold ring-offset-2 dark:ring-offset-brand-neutral-950' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm font-medium text-brand-neutral-500 dark:text-brand-neutral-400">
                  {card.title}
                </span>
                <div className={`rounded-lg p-2 ${card.bgColor} ${card.color}`}>
                  <Icon className="size-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="font-serif text-3xl font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
                    {card.value}
                  </span>
                  <span className="block font-sans text-xs text-brand-neutral-400 dark:text-brand-neutral-500 mt-1">
                    {card.description}
                  </span>
                </div>
                <ArrowRight className="size-5 text-brand-neutral-300 group-hover:translate-x-1 group-hover:text-brand-gold transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick links & actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick actions */}
        <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
          <h3 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50 flex items-center gap-2">
            <TrendingUp className="size-5 text-brand-gold" />
            <span>Accesos Rápidos</span>
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin/productos/nuevo"
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-brand-neutral-300 px-4 py-4 text-sm font-semibold text-brand-neutral-600 hover:border-brand-gold hover:text-brand-gold transition-colors dark:border-brand-neutral-700 dark:text-brand-neutral-400 dark:hover:text-brand-gold"
            >
              <Plus className="size-4" />
              <span>Añadir Producto</span>
            </Link>
            <Link
              href="/admin/categorias"
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-brand-neutral-300 px-4 py-4 text-sm font-semibold text-brand-neutral-600 hover:border-brand-gold hover:text-brand-gold transition-colors dark:border-brand-neutral-700 dark:text-brand-neutral-400 dark:hover:text-brand-gold"
            >
              <FolderTree className="size-4" />
              <span>Ver Categorías</span>
            </Link>
          </div>
        </div>

        {/* System info */}
        <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900 text-sm">
          <h3 className="font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
            Estado del Entorno Demo
          </h3>
          <ul className="mt-4 space-y-3 font-sans text-brand-neutral-600 dark:text-brand-neutral-400">
            <li className="flex justify-between">
              <span>Modo:</span>
              <span className="font-semibold text-brand-neutral-900 dark:text-brand-neutral-200">En Memoria</span>
            </li>
            <li className="flex justify-between">
              <span>Persistencia:</span>
              <span className="font-semibold text-brand-neutral-900 dark:text-brand-neutral-200">Activa (globalThis)</span>
            </li>
            <li className="flex justify-between">
              <span>API Endpoints:</span>
              <span className="font-semibold text-emerald-500">Conectados (Fase 2.5)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
