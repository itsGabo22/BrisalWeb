/**
 * Category repository — interface + mock implementation.
 *
 * Same design contract as the product repository: method signatures match the
 * future Prisma implementation (Fase 3: category.repository.prisma.ts).
 */
import type { Category } from '@/types';
import {
  CAT_ACCESORIOS,
  CAT_ACCESORIOS_WITH_CHILDREN,
  CAT_ACERO,
  CAT_RODIO,
} from './mock-data';

const ALL_FLAT: Category[] = [CAT_ACCESORIOS, CAT_ACERO, CAT_RODIO];

// ─── Interface ────────────────────────────────────────────────────────────────
export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | null>;
  getChildren(parentSlug: string): Promise<Category[]>;
  /** Returns root categories with their `children` array populated. */
  getTree(): Promise<Category[]>;
}

// ─── Mock implementation ──────────────────────────────────────────────────────
class MockCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return ALL_FLAT;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return ALL_FLAT.find((c) => c.slug === slug) ?? null;
  }

  async getChildren(parentSlug: string): Promise<Category[]> {
    const parent = ALL_FLAT.find((c) => c.slug === parentSlug);
    if (!parent) return [];
    return ALL_FLAT.filter((c) => c.parentId === parent.id);
  }

  async getTree(): Promise<Category[]> {
    // Only root categories (parentId === null) are returned, with children nested.
    return [CAT_ACCESORIOS_WITH_CHILDREN];
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const categoryRepository: ICategoryRepository = new MockCategoryRepository();
