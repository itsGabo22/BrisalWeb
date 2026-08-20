import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionResult } from '@/lib/auth/wholesale-session';

/**
 * Marks the in-app wholesale welcome message as seen for the current user, so
 * GET /api/auth/session stops returning `showWelcome: true` for them.
 *
 * Scoped to the session's OWN user id -- there is no id in the request body to
 * trust, on purpose: a wholesaler can only ever dismiss their own welcome.
 */
export async function POST() {
  const { user, isAuthenticated } = await getSessionResult();

  if (!isAuthenticated || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { wholesaleWelcomeSeenAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/wholesale-welcome-seen] Error al marcar el mensaje como visto:', err);
    return NextResponse.json(
      { error: 'No se pudo actualizar el estado' },
      { status: 500 },
    );
  }
}
