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

  // Wrapped in a Blob rather than passed as a raw Buffer: undici (Node's
  // built-in fetch, which supabase-js uses under the hood) has shown corruption
  // on Node 24 when a Buffer is used directly as a fetch body — Blob/Uint8Array
  // bodies take a different, unaffected serialization path.
  const uploadBody = new Blob([processed], { type: 'image/webp' });

  console.log('[TRACE 4] pre-upload body check:', {
    path,
    isBuffer: Buffer.isBuffer(processed),
    length: processed.length,
    hash: traceHash(processed),
    uploadBodyType: 'Blob',
    uploadBodySize: uploadBody.size,
  });

  const { data: uploadData, error } = await supabase.storage
    .from(bucket)
    .upload(path, uploadBody, { contentType: 'image/webp', upsert });

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

/**
 * Uploads a video as-is to Supabase Storage. Returns the public URL.
 *
 * sharp cannot process video, so there is no encode step — but the Blob wrap
 * below is NOT part of that step and must not be skipped with it. The undici
 * corruption this guards against is a property of using a raw Buffer as a
 * fetch body on Node 24, so it applies to ANY binary upload; video is if
 * anything the worse case, because a corrupted frame in a 30MB file will not
 * fail loudly the way a broken image does — it just plays wrong.
 *
 * This path was passing the Buffer straight through, which is exactly the bug
 * AGENTS.md documents for images.
 */
export async function uploadVideo(
  buffer: Buffer,
  { bucket, path, upsert = false }: { bucket: string; path: string; upsert?: boolean },
  contentType: string,
): Promise<string> {
  const supabase = createAdminClient();

  /**
   * A zero-copy view, rather than passing the Buffer straight to Blob.
   *
   * Node's `Buffer` is typed as possibly SharedArrayBuffer-backed, which is not
   * a valid `BlobPart`. Every buffer reaching this function comes from
   * `File.arrayBuffer()`, which is always plain-ArrayBuffer-backed, so the
   * narrowing is safe — and a view avoids copying tens of megabytes of video
   * just to satisfy the type.
   */
  const bytes = new Uint8Array(
    buffer.buffer as ArrayBuffer,
    buffer.byteOffset,
    buffer.byteLength,
  );
  const uploadBody = new Blob([bytes], { type: contentType });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, uploadBody, { contentType, upsert });

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
