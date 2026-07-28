/**
 * Category repository — interface + Prisma implementation.
 */
import { prisma } from '@/lib/prisma';
import type { Category } from '@/types';
import { toCategory } from './mappers';

const LEGACY_ACCESSORIES_SLUG = 'accesorios';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | null>;
  getChildren(parentSlug: string): Promise<Category[]>;
  /** Returns root categories with their `children` array populated. */
  getTree(): Promise<Category[]>;
}

// ─── Prisma implementation ─────────────────────────────────────────────────────
class PrismaCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    const categories = await prisma.category.findMany();
    return categories.map((category) => toCategory(category));
  }

  async getBySlug(slug: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({ where: { slug } });
    return category ? toCategory(category) : null;
  }

  async getChildren(parentSlug: string): Promise<Category[]> {
    // Backward-compatible bridge for the untouched marketing home page.
    if (parentSlug === LEGACY_ACCESSORIES_SLUG) {
      const roots = await prisma.category.findMany({
        where: { parentId: null },
      });
      return roots.map((category) => toCategory(category));
    }

    const parent = await prisma.category.findUnique({
      where: { slug: parentSlug },
    });
    if (!parent) return [];

    const children = await prisma.category.findMany({
      where: { parentId: parent.id },
    });
    return children.map((category) => toCategory(category));
  }

  async getTree(): Promise<Category[]> {
    const roots = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
    });
    return roots.map((root) => toCategory(root));
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const categoryRepository: ICategoryRepository =
  new PrismaCategoryRepository();

/** Server-side fetch of the nav tree — call from a Server Component and pass down as props. */
export async function getCategoryNavigationTree(): Promise<Category[]> {
  return categoryRepository.getTree();
}
