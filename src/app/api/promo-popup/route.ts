import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const popup = await prisma.promoPopup.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  if (!popup.active) {
    return NextResponse.json(null);
  }

  return NextResponse.json(popup);
}
