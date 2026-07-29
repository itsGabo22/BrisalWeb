import sharp from 'sharp';
import { createAdminClient } from './admin';

export function slugifyFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface UploadImageOptions {
  bucket: string;
  path: string;
  maxWidth?: number;
  quality?: number;
  /** Set true for fixed, reused paths (e.g. the promo popup image) that should overwrite in place. */
  upsert?: boolean;
}

/** Resizes + converts an image buffer to WebP, then uploads it to Supabase Storage. Returns the public URL. */
export async function processAndUploadImage(
  buffer: Buffer,
  { bucket, path, maxWidth = 1200, quality = 82, upsert = false }: UploadImageOptions,
): Promise<string> {
  const processed = await sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, processed, { contentType: 'image/webp', upsert });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Uploads a video file as-is (no processing) to Supabase Storage. Returns the public URL. */
export async function uploadVideo(
  buffer: Buffer,
  { bucket, path }: { bucket: string; path: string },
  contentType: string,
): Promise<string> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Removes a file from Supabase Storage given its public URL and bucket. Best-effort — swallows errors. */
export async function deleteFromStorageByUrl(bucket: string, url: string): Promise<void> {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;

  const path = decodeURIComponent(url.slice(index + marker.length));
  const supabase = createAdminClient();
  await supabase.storage.from(bucket).remove([path]).catch(() => {});
}
