import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { processAndUploadImage, slugifyFilename, uploadVideo } from '@/lib/supabase/storage';

function traceHash(buf: Buffer) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

export const runtime = 'nodejs';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export async function GET() {
  const slides = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(slides);
}

export async function POST(request: Request) {
  console.log('[TRACE 0] runtime env:', {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    region: process.env.VERCEL_REGION ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
  try {
    const formData = await request.formData();
    const type = formData.get('type');
    const title = formData.get('title');
    const subtitle = formData.get('subtitle');
    const ctaText = formData.get('ctaText');
    const ctaHref = formData.get('ctaHref');
    const desktopFile = formData.get('desktopFile');
    const mobileFile = formData.get('mobileFile');
    const posterFile = formData.get('posterFile');

    if (type !== 'IMAGE' && type !== 'VIDEO') {
      return NextResponse.json({ error: 'Tipo de slide inválido' }, { status: 400 });
    }

    if (!(desktopFile instanceof File)) {
      return NextResponse.json({ error: 'Debes subir un archivo principal' }, { status: 400 });
    }

    let desktopUrl: string;
    let mobileUrl: string | null = null;
    let posterUrl: string | null = null;
    const timestamp = Date.now();
    const baseName = slugifyFilename(desktopFile.name.replace(/\.[^.]+$/, '')) || 'slide';

    if (type === 'IMAGE') {
      if (!desktopFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'El archivo principal debe ser una imagen' }, { status: 400 });
      }
      const rawArrayBuffer = await desktopFile.arrayBuffer();
      console.log('[TRACE 1] incoming file:', {
        name: desktopFile.name,
        mimeType: desktopFile.type,
        sizeProp: desktopFile.size,
        arrayBufferByteLength: rawArrayBuffer.byteLength,
      });
      const desktopBuffer = Buffer.from(rawArrayBuffer);
      console.log('[TRACE 2] after Buffer.from:', {
        length: desktopBuffer.length,
        hash: traceHash(desktopBuffer),
      });
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

      if (posterFile instanceof File && posterFile.size > 0) {
        if (!posterFile.type.startsWith('image/')) {
          return NextResponse.json({ error: 'La miniatura debe ser una imagen' }, { status: 400 });
        }
        const posterBuffer = Buffer.from(await posterFile.arrayBuffer());
        posterUrl = await processAndUploadImage(posterBuffer, {
          bucket: 'hero-media',
          path: `slides/${timestamp}-${baseName}-poster.webp`,
          maxWidth: 800,
          quality: 82,
        });
      }
    }

    const order = await prisma.heroSlide.count();

    const slide = await prisma.heroSlide.create({
      data: {
        type,
        desktopUrl,
        mobileUrl,
        posterUrl,
        title: typeof title === 'string' && title.trim() ? title.trim() : null,
        subtitle: typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : null,
        ctaText: typeof ctaText === 'string' && ctaText.trim() ? ctaText.trim() : null,
        ctaHref: typeof ctaHref === 'string' && ctaHref.trim() ? ctaHref.trim() : null,
        order,
        active: true,
      },
    });

    // Never let a revalidation hiccup turn an already-successful write into a
    // client-visible failure (the slide is safely persisted at this point).
    try {
      revalidatePath('/');
    } catch (revalidateErr) {
      console.error('[admin/hero-slides] revalidatePath failed (non-fatal):', revalidateErr);
    }

    return NextResponse.json(slide, { status: 201 });
  } catch (err) {
    console.error('[admin/hero-slides] Error al crear slide:', err);
    return NextResponse.json({ error: 'Error al crear el slide' }, { status: 500 });
  }
}
