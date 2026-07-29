import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { processAndUploadImage } from '@/lib/supabase/storage';

interface PromoPopupFields {
  active?: boolean;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string;
  ctaHref?: string | null;
  showOnce?: boolean;
  imageUrl?: string;
}

export const runtime = 'nodejs';

export async function GET() {
  const popup = await prisma.promoPopup.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  return NextResponse.json(popup);
}

export async function PATCH(request: Request) {
  try {
    const formData = await request.formData();
    const active = formData.get('active');
    const title = formData.get('title');
    const subtitle = formData.get('subtitle');
    const ctaText = formData.get('ctaText');
    const ctaHref = formData.get('ctaHref');
    const showOnce = formData.get('showOnce');
    const imageFile = formData.get('imageFile');

    const data: PromoPopupFields = {};

    if (active !== null) data.active = active === 'true';
    if (title !== null) data.title = typeof title === 'string' && title.trim() ? title.trim() : null;
    if (subtitle !== null)
      data.subtitle = typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : null;
    if (ctaText !== null)
      data.ctaText = typeof ctaText === 'string' && ctaText.trim() ? ctaText.trim() : 'Ver oferta';
    if (ctaHref !== null)
      data.ctaHref = typeof ctaHref === 'string' && ctaHref.trim() ? ctaHref.trim() : null;
    if (showOnce !== null) data.showOnce = showOnce === 'true';

    if (imageFile instanceof File && imageFile.size > 0) {
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const url = await processAndUploadImage(buffer, {
        bucket: 'hero-media',
        path: 'promo/popup.webp',
        maxWidth: 800,
        quality: 85,
        upsert: true,
      });
      data.imageUrl = url;
    }

    const popup = await prisma.promoPopup.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });

    try {
      revalidatePath('/');
    } catch (revalidateErr) {
      console.error('[admin/promo-popup] revalidatePath failed (non-fatal):', revalidateErr);
    }

    return NextResponse.json(popup);
  } catch (err) {
    console.error('[admin/promo-popup] Error al actualizar popup:', err);
    return NextResponse.json({ error: 'Error al actualizar el popup' }, { status: 500 });
  }
}
