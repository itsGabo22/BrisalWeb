import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

interface SiteConfigFields {
  announcementText?: string;
  announcementActive?: boolean;
}

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
    const body = await request.json();
    const { announcementText, announcementActive } = body as {
      announcementText?: string;
      announcementActive?: boolean;
    };

    const data: SiteConfigFields = {};
    if (typeof announcementText === 'string') data.announcementText = announcementText.trim();
    if (typeof announcementActive === 'boolean') data.announcementActive = announcementActive;

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
