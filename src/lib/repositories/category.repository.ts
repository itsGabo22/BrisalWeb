/**
 * Category repository — interface + mock implementation using categoryStore.
 */
import type { Category } from '@/types';
import { categoryStore } from '@/lib/stores/adminStore';
import { ROOT_CATEGORIES, SUBCATEGORIES } from './mock-data';

export const categoryNavigationTree: Category[] = ROOT_CATEGORIES.map((root) => ({
  ...root,
  children: SUBCATEGORIES.filter((sub) => sub.parentId === root.id),
}));

const LEGACY_ACCESSORIES_SLUG = 'accesorios';


function withChildren(category: Category, allCategories: Category[]): Category {
  return {
    ...category,
    children: allCategories.filter((child) => child.parentId === category.id),
  };
}

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
    return categoryStore.getAll();
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return categoryStore.getBySlug(slug);
  }

  async getChildren(parentSlug: string): Promise<Category[]> {
    const all = categoryStore.getAll();
    const roots = all.filter((c) => !c.parentId);
    
    // Backward-compatible bridge for the untouched marketing home page.
    if (parentSlug === LEGACY_ACCESSORIES_SLUG) {
      return roots;
    }

    const parent = all.find(
      (category) => category.slug === parentSlug,
    );
    if (!parent) return [];
    return all.filter((category) => category.parentId === parent.id);
  }

  async getTree(): Promise<Category[]> {
    const all = categoryStore.getAll();
    const roots = all.filter((c) => !c.parentId);
    return roots.map((root) => withChildren(root, all));
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const categoryRepository: ICategoryRepository =
  new MockCategoryRepository();
