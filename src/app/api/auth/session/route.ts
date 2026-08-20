import { NextResponse } from 'next/server';
import { getSessionResult } from '@/lib/auth/wholesale-session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { user, isAuthenticated, isApproved } = await getSessionResult();

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
    userId: user?.id ?? null,
    showWelcome,
    welcomeMessage,
  });
}
