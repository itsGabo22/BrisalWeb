import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  deleteFromStorageByUrl,
  processAndUploadImage,
  slugifyFilename,
  uploadVideo,
} from '@/lib/supabase/storage';
import { parsePercent } from '@/lib/admin/hero-slides';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Slide no encontrado' }, { status: 404 });
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const subtitle = formData.get('subtitle');
    const ctaText = formData.get('ctaText');
    const ctaHref = formData.get('ctaHref');
    const active = formData.get('active');
    const order = formData.get('order');
    const desktopFile = formData.get('desktopFile');
    const mobileFile = formData.get('mobileFile');
    const posterFile = formData.get('posterFile');

    const data: Prisma.HeroSlideUpdateInput = {};

    if (title !== null) data.title = typeof title === 'string' && title.trim() ? title.trim() : null;
    if (subtitle !== null)
      data.subtitle = typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : null;
    if (ctaText !== null)
      data.ctaText = typeof ctaText === 'string' && ctaText.trim() ? ctaText.trim() : null;
    if (ctaHref !== null)
      data.ctaHref = typeof ctaHref === 'string' && ctaHref.trim() ? ctaHref.trim() : null;
    if (active !== null) data.active = active === 'true';
    if (order !== null && !Number.isNaN(Number(order))) data.order = Number(order);

    /**
     * Focal points fall back to what is ALREADY stored, not to 50.
     *
     * The reorder and activate/deactivate actions PATCH with a FormData holding
     * only `order` or `active`. Defaulting to centre here would silently throw
     * away a crop the client had arranged every time they moved a slide up the
     * list.
     */
    data.desktopPosX = parsePercent(formData.get('desktopPosX'), existing.desktopPosX);
    data.desktopPosY = parsePercent(formData.get('desktopPosY'), existing.desktopPosY);
    data.mobilePosX = parsePercent(formData.get('mobilePosX'), existing.mobilePosX);
    data.mobilePosY = parsePercent(formData.get('mobilePosY'), existing.mobilePosY);

    const timestamp = Date.now();

    if (existing.type === 'IMAGE' && desktopFile instanceof File && desktopFile.size > 0) {
      if (!desktopFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'El archivo principal debe ser una imagen' }, { status: 400 });
      }
      const baseName = slugifyFilename(desktopFile.name.replace(/\.[^.]+$/, '')) || 'slide';
      const buffer = Buffer.from(await desktopFile.arrayBuffer());
      const newUrl = await processAndUploadImage(buffer, {
        bucket: 'hero-media',
        path: `slides/${timestamp}-${baseName}-desktop.webp`,
        maxWidth: 1920,
        quality: 82,
      });
      await deleteFromStorageByUrl('hero-media', existing.desktopUrl);
      data.desktopUrl = newUrl;
    }

    if (existing.type === 'IMAGE' && mobileFile instanceof File && mobileFile.size > 0) {
      if (!mobileFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'El archivo móvil debe ser una imagen' }, { status: 400 });
      }
      const baseName = slugifyFilename(mobileFile.name.replace(/\.[^.]+$/, '')) || 'slide';
      const buffer = Buffer.from(await mobileFile.arrayBuffer());
      const newUrl = await processAndUploadImage(buffer, {
        bucket: 'hero-media',
        path: `slides/${timestamp}-${baseName}-mobile.webp`,
        maxWidth: 1080,
        quality: 82,
      });
      if (existing.mobileUrl) await deleteFromStorageByUrl('hero-media', existing.mobileUrl);
      data.mobileUrl = newUrl;
    }

    if (existing.type === 'VIDEO' && desktopFile instanceof File && desktopFile.size > 0) {
      if (!ALLOWED_VIDEO_TYPES.includes(desktopFile.type)) {
        return NextResponse.json({ error: 'El video debe ser MP4 o WebM' }, { status: 400 });
      }
      if (desktopFile.size > MAX_VIDEO_BYTES) {
        return NextResponse.json({ error: 'El video no puede superar 100MB' }, { status: 400 });
      }
      const baseName = slugifyFilename(desktopFile.name.replace(/\.[^.]+$/, '')) || 'slide';
      const buffer = Buffer.from(await desktopFile.arrayBuffer());
      const ext = desktopFile.type === 'video/webm' ? 'webm' : 'mp4';
      const newUrl = await uploadVideo(
        buffer,
        { bucket: 'hero-media', path: `slides/${timestamp}-${baseName}.${ext}` },
        desktopFile.type,
      );
      await deleteFromStorageByUrl('hero-media', existing.desktopUrl);
      data.desktopUrl = newUrl;
    }

    if (existing.type === 'VIDEO' && posterFile instanceof File && posterFile.size > 0) {
      if (!posterFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'La miniatura debe ser una imagen' }, { status: 400 });
      }
      const baseName = slugifyFilename(posterFile.name.replace(/\.[^.]+$/, '')) || 'slide';
      const buffer = Buffer.from(await posterFile.arrayBuffer());
      const newUrl = await processAndUploadImage(buffer, {
        bucket: 'hero-media',
        path: `slides/${timestamp}-${baseName}-poster.webp`,
        maxWidth: 800,
        quality: 82,
      });
      if (existing.posterUrl) await deleteFromStorageByUrl('hero-media', existing.posterUrl);
      data.posterUrl = newUrl;
    }

    const updated = await prisma.heroSlide.update({ where: { id }, data });

    try {
      revalidatePath('/');
    } catch (revalidateErr) {
      console.error('[admin/hero-slides/[id]] revalidatePath failed (non-fatal):', revalidateErr);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[admin/hero-slides/[id]] Error al actualizar slide:', err);
    return NextResponse.json({ error: 'Error al actualizar el slide' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Slide no encontrado' }, { status: 404 });
    }

    await deleteFromStorageByUrl('hero-media', existing.desktopUrl);
    if (existing.mobileUrl) await deleteFromStorageByUrl('hero-media', existing.mobileUrl);
    if (existing.posterUrl) await deleteFromStorageByUrl('hero-media', existing.posterUrl);
    await prisma.heroSlide.delete({ where: { id } });

    try {
      revalidatePath('/');
    } catch (revalidateErr) {
      console.error('[admin/hero-slides/[id]] revalidatePath failed (non-fatal):', revalidateErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/hero-slides/[id]] Error al eliminar slide:', err);
    return NextResponse.json({ error: 'Error al eliminar el slide' }, { status: 500 });
  }
}
