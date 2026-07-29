import sharp from 'sharp';
import { createHash } from 'crypto';
import { createAdminClient } from './admin';

function traceHash(buf: Buffer) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

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

  console.log('[TRACE 3] sharp output:', {
    path,
    isBuffer: Buffer.isBuffer(processed),
    length: processed.length,
    hash: traceHash(processed),
    sharpVersions: sharp.versions,
  });

  const supabase = createAdminClient();

  console.log('[TRACE 4] pre-upload body check:', {
    path,
    isBuffer: Buffer.isBuffer(processed),
    length: processed.length,
    hash: traceHash(processed),
  });

  const { data: uploadData, error } = await supabase.storage
    .from(bucket)
    .upload(path, processed, { contentType: 'image/webp', upsert });

  console.log('[TRACE 5] upload result:', { path, uploadData, error });

  if (error) throw error;

  const { data: downloaded, error: downloadErr } = await supabase.storage.from(bucket).download(path);
  if (downloaded) {
    const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());
    console.log('[TRACE 5b] round-trip download:', {
      path,
      length: downloadedBuffer.length,
      hash: traceHash(downloadedBuffer),
      matchesTrace3: downloadedBuffer.length === processed.length && traceHash(downloadedBuffer) === traceHash(processed),
    });
  } else {
    console.log('[TRACE 5b] round-trip download failed:', { path, downloadErr });
  }

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
