/**
 * Public API for the repository layer.
 * Components and pages import from here — never from the individual files directly.
 */
export type { IProductRepository, GetAllProductsOptions } from './product.repository';
export { productRepository } from './product.repository';

export type { ICategoryRepository } from './category.repository';
export { categoryRepository } from './category.repository';
