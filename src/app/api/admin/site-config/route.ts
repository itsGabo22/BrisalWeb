import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  deleteFromStorageByUrl,
  processAndUploadImage,
  uploadVideo,
} from '@/lib/supabase/storage';

interface SiteConfigFields {
  announcementText?: string;
  announcementActive?: boolean;
  wholesaleImageUrl?: string;
  videoSectionTitle?: string;
  videoSectionBody?: string;
  videoSectionVideoUrl?: string;
  videoSectionLinkUrl?: string;
  wholesaleVideoUrl?: string;
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

/**
 * 40MB per section video.
 *
 * Lower than the hero's 100MB on purpose. The hero is a single, expected,
 * above-the-fold asset; these are decorative loops and there can be TWO of them
 * on the homepage at once, so the cap is what stops the page from shipping
 * 200MB of video. 40MB still comfortably holds a 15-25s 1080p H.264 loop at a
 * good bitrate, which is the length these sections are for.
 */
const MAX_SECTION_VIDEO_BYTES = 40 * 1024 * 1024;

/**
 * The two admin-uploadable section videos, as data rather than duplicated
 * blocks — the same shape `PARALLAX_SLOTS` uses for the backdrops.
 */
const VIDEO_SLOTS = [
  { column: 'videoSectionVideoUrl', formKey: 'videoSectionFile', slug: 'video-section' },
  { column: 'wholesaleVideoUrl', formKey: 'wholesaleVideoFile', slug: 'wholesale' },
] as const;

/**
 * The two parallax backdrops, as data rather than as two copy-pasted blocks.
 *
 * `hero-media` is the existing bucket for site-chrome imagery (hero slides live
 * under `slides/`, the popup under `promo/`), so these get their own `parallax/`
 * prefix in the same place rather than a new bucket to configure and secure.
 */
const PARALLAX_SLOTS = [
  // The brand-statement slot was removed with its admin control: that band is
  // video+text now and reads no image. Its column survives as deprecated —
  // see the schema — but nothing writes it any more either.
  { column: 'wholesaleImageUrl', formKey: 'wholesaleFile', slug: 'wholesale' },
] as const;

// sharp needs the Node runtime; the edge runtime cannot process the upload.
export const runtime = 'nodejs';

export async function GET() {
  const config = await prisma.siteConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  return NextResponse.json(config);
}

export async function PATCH(request: Request) {
  try {
    const data: SiteConfigFields = {};

    // Two content types on one route: the banner editor still sends JSON, and
    // the parallax editor has to send multipart because it carries files.
    // Branching here keeps a single site-config endpoint rather than splitting
    // the singleton across two routes that would both need the same guards.
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const announcementText = formData.get('announcementText');
      const announcementActive = formData.get('announcementActive');
      if (typeof announcementText === 'string') data.announcementText = announcementText.trim();
      if (announcementActive !== null) data.announcementActive = announcementActive === 'true';

      // Read once, so a replaced image can have its predecessor cleaned up.
      const existing = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } });

      for (const slot of PARALLAX_SLOTS) {
        const file = formData.get(slot.formKey);
        if (!(file instanceof File) || file.size === 0) continue;

        if (!file.type.startsWith('image/')) {
          return NextResponse.json(
            { error: 'El archivo debe ser una imagen' },
            { status: 400 },
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // A timestamped path rather than a fixed one overwritten in place:
        // these are full-bleed backdrops behind a CDN, and reusing the URL
        // means the client uploads a new photo and keeps seeing the old one.
        // 1920 wide because the image is deliberately oversized and cropped.
        const url = await processAndUploadImage(buffer, {
          bucket: 'hero-media',
          path: `parallax/${slot.slug}-${Date.now()}.webp`,
          maxWidth: 1920,
          quality: 82,
        });

        const previous = existing?.[slot.column];
        if (previous) await deleteFromStorageByUrl('hero-media', previous);

        data[slot.column] = url;
      }

      // Section copy. Only assigned when the field was actually sent, so
      // uploading a video cannot blank a title the client already wrote.
      for (const key of [
        'videoSectionTitle',
        'videoSectionBody',
        'videoSectionLinkUrl',
      ] as const) {
        const value = formData.get(key);
        if (typeof value === 'string') data[key] = value.trim();
      }

      /**
       * Section videos. No sharp step — sharp cannot process video — but
       * `uploadVideo` still Blob-wraps the buffer, which is the part that
       * matters: the undici corruption is about using a raw Buffer as a fetch
       * body, not about image encoding.
       */
      for (const slot of VIDEO_SLOTS) {
        const file = formData.get(slot.formKey);
        if (!(file instanceof File) || file.size === 0) continue;

        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: 'El video debe ser MP4 o WebM' },
            { status: 400 },
          );
        }
        if (file.size > MAX_SECTION_VIDEO_BYTES) {
          return NextResponse.json(
            { error: 'El video no puede superar 40MB' },
            { status: 400 },
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.type === 'video/webm' ? 'webm' : 'mp4';
        // Timestamped rather than overwritten in place, for the same reason
        // the backdrops are: these sit behind a CDN and reusing the path means
        // uploading a new video and still seeing the old one.
        const url = await uploadVideo(
          buffer,
          { bucket: 'hero-media', path: `sections/${slot.slug}-${Date.now()}.${ext}` },
          file.type,
        );

        const previous = existing?.[slot.column];
        if (previous) await deleteFromStorageByUrl('hero-media', previous);

        data[slot.column] = url;
      }
    } else {
      const body = (await request.json()) as {
        announcementText?: string;
        announcementActive?: boolean;
      };
      if (typeof body.announcementText === 'string')
        data.announcementText = body.announcementText.trim();
      if (typeof body.announcementActive === 'boolean')
        data.announcementActive = body.announcementActive;
    }

    // Every field above is set only when the request actually carried it, so a
    // partial update leaves everything else alone — saving the banner text can
    // never blank an already-configured parallax image, and saving a parallax
    // image can never revert the banner.
    const config = await prisma.siteConfig.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });

    try {
      revalidatePath('/');
    } catch (revalidateErr) {
      console.error('[admin/site-config] revalidatePath failed (non-fatal):', revalidateErr);
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error('[admin/site-config] Error al actualizar configuración:', err);
    return NextResponse.json({ error: 'Error al actualizar la configuración' }, { status: 500 });
  }
}
