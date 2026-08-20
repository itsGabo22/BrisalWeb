import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicReadErrorResponse } from '@/lib/public-errors';

export async function GET() {
  try {
    const popup = await prisma.promoPopup.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });

    if (!popup.active) {
      return NextResponse.json(null);
    }

    return NextResponse.json(popup);
  } catch (err) {
    /**
     * Was unguarded, and this one runs on EVERY page load (the popup mounts
     * site-wide), so a transient pool exhaustion here surfaced as an opaque
     * unhandled 500 on the busiest request the site makes.
     *
     * `null` rather than a 500: no popup is a completely valid state that the
     * client already handles by rendering nothing, so a database hiccup should
     * degrade to "no popup today" instead of putting an error in the console of
     * every visitor. The fault is still logged under a findable tag.
     */
    publicReadErrorResponse('promo-popup', err);
    return NextResponse.json(null);
  }
}
