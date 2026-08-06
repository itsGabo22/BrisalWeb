/**
 * Shared helpers for the two category admin routes (POST /api/admin/categorias
 * and PATCH /api/admin/categorias/[id]). Kept out of the route files because a
 * `route.ts` may only export route handlers and Next's config keys.
 */
import { revalidatePath } from 'next/cache';
import {
  processAndUploadImage,
  slugifyFilename,
} from '@/lib/supabase/storage';

/**
 * Category showcase images are site chrome, not product photography, so they
 * live alongside the hero slides and promo popup in `hero-media` rather than in
 * `product-images`. Reusing an existing bucket avoids provisioning a new one
 * (and its RLS/policy setup) for four or five files.
 */
export const CATEGORY_IMAGE_BUCKET = 'hero-media';
export const CATEGORY_IMAGE_PREFIX = 'categories';

export interface ParsedCategoryForm {
  fields: {
    name?: string;
    description?: string | null;
    parentId?: string | null;
    imageUrl?: string | null;
  };
  imageFile: File | null;
}

/**
 * Reads the admin form's multipart body.
 *
 * Only keys actually PRESENT in the body land in `fields` — this is what makes
 * the PATCH safe: the form omits `imageUrl` entirely when the client is just
 * renaming a category, so the column is never included in the update and the
 * existing image survives. An explicit empty `imageUrl` is still honoured as
 * "clear it", which is how removal works.
 */
export function parseCategoryFormData(formData: FormData): ParsedCategoryForm {
  const fields: ParsedCategoryForm['fields'] = {};

  const name = formData.get('name');
  if (typeof name === 'string') fields.name = name.trim();

  const description = formData.get('description');
  if (description !== null) {
    fields.description =
      typeof description === 'string' && description.trim()
        ? description.trim()
        : null;
  }

  const parentId = formData.get('parentId');
  if (parentId !== null) {
    fields.parentId =
      typeof parentId === 'string' && parentId.trim() ? parentId.trim() : null;
  }

  const imageUrl = formData.get('imageUrl');
  if (imageUrl !== null) {
    fields.imageUrl =
      typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;
  }

  const imageFile = formData.get('imageFile');
  return {
    fields,
    imageFile:
      imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
  };
}

/**
 * Processes and uploads a category showcase image.
 *
 * Goes through `processAndUploadImage`, which is the project's proven path:
 * sharp → WebP, then the buffer wrapped in a Blob before `.upload()`. The Blob
 * wrap is not cosmetic — passing a raw Buffer as a fetch body corrupts the
 * upload under undici on Node 24. Do not "simplify" it away.
 *
 * Portrait-oriented cards, so 1200px on the long edge is plenty.
 */
export async function uploadCategoryImage(
  file: File,
  slug: string,
): Promise<{ url: string } | { error: string }> {
  if (!file.type.startsWith('image/')) {
    return { error: 'El archivo debe ser una imagen' };
  }

  const baseName = slugifyFilename(slug) || 'categoria';
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await processAndUploadImage(buffer, {
    bucket: CATEGORY_IMAGE_BUCKET,
    // Timestamped rather than a fixed path: a stable filename would be served
    // stale from the CDN edge after a re-upload.
    path: `${CATEGORY_IMAGE_PREFIX}/${Date.now()}-${baseName}.webp`,
    maxWidth: 1200,
    quality: 82,
  });

  return { url };
}

/** The homepage showcase and the catalog tree both read categories. */
export function revalidateCategorySurfaces() {
  try {
    revalidatePath('/');
    revalidatePath('/catalogo');
  } catch (revalidateErr) {
    console.error(
      '[admin/categorias] revalidatePath failed (non-fatal):',
      revalidateErr,
    );
  }
}
