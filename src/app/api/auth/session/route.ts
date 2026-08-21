import { NextResponse } from 'next/server';
import { getSessionResult } from '@/lib/auth/wholesale-session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { user, isAuthenticated, isApproved, isRevoked } = await getSessionResult();

    /**
     * `showWelcome` fires exactly once per approval: true only while the
     * wholesaler is approved AND hasn't seen the message yet (`seenAt` null).
     * The message text is only fetched when it's actually going to be shown --
     * no reason to hit SiteConfig on every session check otherwise.
     */
    const showWelcome = isApproved && !!user && user.wholesaleWelcomeSeenAt === null;
    let welcomeMessage: string | null = null;
    if (showWelcome) {
      const config = await prisma.siteConfig.findUnique({
        where: { id: 'singleton' },
        select: { wholesaleWelcomeMessage: true },
      });
      welcomeMessage = config?.wholesaleWelcomeMessage ?? null;
    }

    return NextResponse.json({
      authenticated: isAuthenticated,
      approved: isApproved,
      // Drives copy only — "acceso revocado" instead of "solicitud en
      // revisión". Never a pricing input; `approved` is.
      revoked: isRevoked,
      userId: user?.id ?? null,
      showWelcome,
      welcomeMessage,
    });
  } catch (err) {
    /**
     * Was unguarded despite doing two awaited lookups. This endpoint is polled
     * by the cart and the wholesale banner, so an unhandled rejection here
     * meant a database blip could put a 500 in front of a shopper mid-checkout.
     *
     * Degrades to "signed out" rather than 500ing: every caller already handles
     * the unauthenticated shape, and the worst outcome is that an approved
     * wholesaler momentarily sees retail prices -- strictly better than a
     * broken page. It must never fail OPEN in the other direction, which is why
     * `approved` is hardcoded false here rather than preserved from a partial
     * read.
     */
    console.error('[auth/session] Error al leer la sesión:', err);
    return NextResponse.json({
      authenticated: false,
      approved: false,
      revoked: false,
      userId: null,
      showWelcome: false,
      welcomeMessage: null,
    });
  }
}
