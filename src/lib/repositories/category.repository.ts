/**
 * Category repository — interface + mock implementation.
 *
 * Same design contract as the product repository: method signatures match the
 * future Prisma implementation (Fase 3: category.repository.prisma.ts).
 */
import type { Category } from '@/types';
import { ALL_CATEGORIES, ROOT_CATEGORIES } from './mock-data';

const LEGACY_ACCESSORIES_SLUG = 'accesorios';

function withChildren(category: Category): Category {
  return {
    ...category,
    children: ALL_CATEGORIES.filter((child) => child.parentId === category.id),
  };
}

export const categoryNavigationTree: Category[] =
  ROOT_CATEGORIES.map(withChildren);

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
    return ALL_CATEGORIES;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return ALL_CATEGORIES.find((category) => category.slug === slug) ?? null;
  }

  async getChildren(parentSlug: string): Promise<Category[]> {
    // Backward-compatible bridge for the untouched marketing home page.
    if (parentSlug === LEGACY_ACCESSORIES_SLUG) {
      return ROOT_CATEGORIES;
    }

    const parent = ALL_CATEGORIES.find(
      (category) => category.slug === parentSlug,
    );
    if (!parent) return [];
    return ALL_CATEGORIES.filter((category) => category.parentId === parent.id);
  }

  async getTree(): Promise<Category[]> {
    return categoryNavigationTree;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const categoryRepository: ICategoryRepository =
  new MockCategoryRepository();
