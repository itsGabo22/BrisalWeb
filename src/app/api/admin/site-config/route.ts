import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { deleteFromStorageByUrl, processAndUploadImage } from '@/lib/supabase/storage';

interface SiteConfigFields {
  announcementText?: string;
  announcementActive?: boolean;
  brandStatementImageUrl?: string;
  wholesaleImageUrl?: string;
}

/**
 * The two parallax backdrops, as data rather than as two copy-pasted blocks.
 *
 * `hero-media` is the existing bucket for site-chrome imagery (hero slides live
 * under `slides/`, the popup under `promo/`), so these get their own `parallax/`
 * prefix in the same place rather than a new bucket to configure and secure.
 */
const PARALLAX_SLOTS = [
  { column: 'brandStatementImageUrl', formKey: 'brandStatementFile', slug: 'brand-statement' },
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
