import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { processAndUploadImage, slugifyFilename, uploadVideo } from '@/lib/supabase/storage';

export const runtime = 'nodejs';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export async function GET() {
  const slides = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(slides);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const type = formData.get('type');
    const title = formData.get('title');
    const subtitle = formData.get('subtitle');
    const ctaText = formData.get('ctaText');
    const ctaHref = formData.get('ctaHref');
    const desktopFile = formData.get('desktopFile');
    const mobileFile = formData.get('mobileFile');

    if (type !== 'IMAGE' && type !== 'VIDEO') {
      return NextResponse.json({ error: 'Tipo de slide inválido' }, { status: 400 });
    }

    if (!(desktopFile instanceof File)) {
      return NextResponse.json({ error: 'Debes subir un archivo principal' }, { status: 400 });
    }

    let desktopUrl: string;
    let mobileUrl: string | null = null;
    const timestamp = Date.now();
    const baseName = slugifyFilename(desktopFile.name.replace(/\.[^.]+$/, '')) || 'slide';

    if (type === 'IMAGE') {
      if (!desktopFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'El archivo principal debe ser una imagen' }, { status: 400 });
      }
      const desktopBuffer = Buffer.from(await desktopFile.arrayBuffer());
      desktopUrl = await processAndUploadImage(desktopBuffer, {
        bucket: 'hero-media',
        path: `slides/${timestamp}-${baseName}-desktop.webp`,
        maxWidth: 1920,
        quality: 82,
      });

      if (mobileFile instanceof File && mobileFile.size > 0) {
        if (!mobileFile.type.startsWith('image/')) {
          return NextResponse.json({ error: 'El archivo móvil debe ser una imagen' }, { status: 400 });
        }
        const mobileBuffer = Buffer.from(await mobileFile.arrayBuffer());
        mobileUrl = await processAndUploadImage(mobileBuffer, {
          bucket: 'hero-media',
          path: `slides/${timestamp}-${baseName}-mobile.webp`,
          maxWidth: 1080,
          quality: 82,
        });
      }
    } else {
      if (!ALLOWED_VIDEO_TYPES.includes(desktopFile.type)) {
        return NextResponse.json({ error: 'El video debe ser MP4 o WebM' }, { status: 400 });
      }
      if (desktopFile.size > MAX_VIDEO_BYTES) {
        return NextResponse.json({ error: 'El video no puede superar 100MB' }, { status: 400 });
      }
      const videoBuffer = Buffer.from(await desktopFile.arrayBuffer());
      const ext = desktopFile.type === 'video/webm' ? 'webm' : 'mp4';
      desktopUrl = await uploadVideo(
        videoBuffer,
        { bucket: 'hero-media', path: `slides/${timestamp}-${baseName}.${ext}` },
        desktopFile.type,
      );
    }

    const order = await prisma.heroSlide.count();

    const slide = await prisma.heroSlide.create({
      data: {
        type,
        desktopUrl,
        mobileUrl,
        title: typeof title === 'string' && title.trim() ? title.trim() : null,
        subtitle: typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : null,
        ctaText: typeof ctaText === 'string' && ctaText.trim() ? ctaText.trim() : null,
        ctaHref: typeof ctaHref === 'string' && ctaHref.trim() ? ctaHref.trim() : null,
        order,
        active: true,
      },
    });

    revalidatePath('/');

    return NextResponse.json(slide, { status: 201 });
  } catch (err) {
    console.error('[admin/hero-slides] Error al crear slide:', err);
    return NextResponse.json({ error: 'Error al crear el slide' }, { status: 500 });
  }
}
