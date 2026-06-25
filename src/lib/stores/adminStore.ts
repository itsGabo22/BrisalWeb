import type { Product, Category, Discount, Wholesaler } from '@/types';
import {
  MOCK_PRODUCTS,
  ALL_CATEGORIES,
  MOCK_DISCOUNTS,
  MOCK_WHOLESALERS,
} from '../repositories/mock-data';

interface InMemoryState {
  products: Product[];
  categories: Category[];
  discounts: Discount[];
  wholesalers: Wholesaler[];
}

const globalForAdminStore = globalThis as unknown as {
  adminStoreState?: InMemoryState;
};

// Initialize from mocks if not exists
if (!globalForAdminStore.adminStoreState) {
  globalForAdminStore.adminStoreState = {
    products: JSON.parse(JSON.stringify(MOCK_PRODUCTS)),
    categories: JSON.parse(JSON.stringify(ALL_CATEGORIES)),
    discounts: JSON.parse(JSON.stringify(MOCK_DISCOUNTS)),
    wholesalers: JSON.parse(JSON.stringify(MOCK_WHOLESALERS)),
  };
}

const state = globalForAdminStore.adminStoreState!;

export const productStore = {
  getAll: () => state.products,
  getById: (id: string) => state.products.find((p) => p.id === id) || null,
  getBySlug: (slug: string) => state.products.find((p) => p.slug === slug) || null,
  create: (product: Omit<Product, 'id' | 'category' | 'tags' | 'discounts'> & { categoryId: string; tags: string[] }) => {
    const id = `prod-${Math.random().toString(36).substr(2, 9)}`;
    const category = state.categories.find((c) => c.id === product.categoryId) || {
      id: product.categoryId,
      name: 'Sin Categoría',
      slug: 'sin-categoria',
    };
    
    const newProduct: Product = {
      ...product,
      id,
      category,
      tags: product.tags.map((tId) => ({ id: tId, name: tId.replace('tag-', ''), slug: tId.replace('tag-', '') })),
      discounts: [],
    };
    state.products.push(newProduct);
    return newProduct;
  },
  update: (id: string, product: Partial<Product> & { categoryId?: string; tags?: string[] }) => {
    const index = state.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = state.products[index];
    const category = product.categoryId
      ? state.categories.find((c) => c.id === product.categoryId) || existing.category
      : existing.category;

    const tags = product.tags
      ? (product.tags as unknown as string[]).map((tId) => ({ id: tId, name: tId.replace('tag-', ''), slug: tId.replace('tag-', '') }))
      : existing.tags;

    const updatedProduct: Product = {
      ...existing,
      ...product,
      category,
      tags,
    } as Product;

    state.products[index] = updatedProduct;
    return updatedProduct;
  },
  delete: (id: string) => {
    const index = state.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      state.products.splice(index, 1);
      return true;
    }
    return false;
  },
};

export const categoryStore = {
  getAll: () => state.categories,
  getById: (id: string) => state.categories.find((c) => c.id === id) || null,
  getBySlug: (slug: string) => state.categories.find((c) => c.slug === slug) || null,
  create: (category: Omit<Category, 'id' | 'children'>) => {
    const id = `cat-${Math.random().toString(36).substr(2, 9)}`;
    const newCategory: Category = {
      ...category,
      id,
    };
    state.categories.push(newCategory);
    return newCategory;
  },
  update: (id: string, category: Partial<Category>) => {
    const index = state.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    const updated = {
      ...state.categories[index],
      ...category,
    };
    state.categories[index] = updated;
    return updated;
  },
  delete: (id: string) => {
    const index = state.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      state.categories.splice(index, 1);
      return true;
    }
    return false;
  },
};

export const discountStore = {
  getAll: () => state.discounts,
  getById: (id: string) => state.discounts.find((d) => d.id === id) || null,
  create: (discount: Omit<Discount, 'id'>) => {
    const id = `disc-${Math.random().toString(36).substr(2, 9)}`;
    const newDiscount: Discount = {
      ...discount,
      id,
    };
    state.discounts.push(newDiscount);
    
    // Apply discount reference to products in store if scoped by PRODUCT
    if (discount.scope === 'PRODUCT' && discount.productId) {
      const prod = state.products.find((p) => p.id === discount.productId);
      if (prod) {
        if (!prod.discounts) prod.discounts = [];
        prod.discounts.push(newDiscount);
      }
    }

    return newDiscount;
  },
  update: (id: string, discount: Partial<Discount>) => {
    const index = state.discounts.findIndex((d) => d.id === id);
    if (index === -1) return null;
    const updated = {
      ...state.discounts[index],
      ...discount,
    };
    state.discounts[index] = updated;
    return updated;
  },
  delete: (id: string) => {
    const index = state.discounts.findIndex((d) => d.id === id);
    if (index !== -1) {
      state.discounts.splice(index, 1);
      // Remove discount from products
      state.products.forEach((p) => {
        if (p.discounts) {
          p.discounts = p.discounts.filter((d) => d.id !== id);
        }
      });
      return true;
    }
    return false;
  },
};

export const wholesalerStore = {
  getAll: () => state.wholesalers,
  getById: (id: string) => state.wholesalers.find((w) => w.id === id) || null,
  create: (wholesaler: Omit<Wholesaler, 'id' | 'fechaRegistro'>) => {
    const id = `ws-${Math.random().toString(36).substr(2, 9)}`;
    const newWholesaler: Wholesaler = {
      ...wholesaler,
      id,
      fechaRegistro: new Date().toISOString(),
    };
    state.wholesalers.push(newWholesaler);
    return newWholesaler;
  },
  updateStatus: (id: string, estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO') => {
    const index = state.wholesalers.findIndex((w) => w.id === id);
    if (index === -1) return null;
    state.wholesalers[index].estado = estado;
    return state.wholesalers[index];
  },
};
