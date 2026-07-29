import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAndUploadImage, slugifyFilename } from '@/lib/supabase/storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = slugifyFilename(file.name.replace(/\.[^.]+$/, '')) || 'imagen';
    const filename = `${Date.now()}-${baseName}.webp`;
    const path = `bandeja/${filename}`;

    const url = await processAndUploadImage(buffer, {
      bucket: 'product-images',
      path,
      maxWidth: 1200,
      quality: 82,
    });

    const image = await prisma.imageBandeja.create({
      data: { url, filename, assigned: false },
    });

    return NextResponse.json(
      { id: image.id, url: image.url, filename: image.filename },
      { status: 201 },
    );
  } catch (err) {
    console.error('[admin/imagenes/upload] Error al subir imagen:', err);
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 });
  }
}
