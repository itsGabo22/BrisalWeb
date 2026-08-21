import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import type { User as PrismaUser } from '@prisma/client';

export interface WholesaleSessionResult {
  user: PrismaUser | null;
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
  /**
   * Access was granted and has since been withdrawn — distinct from an
   * application still awaiting a decision.
   *
   * Worth telling apart from `isPending` because the two get different copy:
   * without this, revoking someone left them logged in and staring at
   * "Solicitud en revisión — te notificaremos cuando sea aprobada", which is
   * simply untrue and would send them to WhatsApp to ask about an application
   * they made months ago.
   *
   * It has NO bearing on pricing. `isApproved` alone decides that, and revoking
   * sets `approved = false`.
   */
  isRevoked: boolean;
}

/** Resolves the current wholesale session from the Supabase auth cookie + the matching Prisma User row. */
export async function getSessionResult(): Promise<WholesaleSessionResult> {
  const supabase = await createClient();
  // getUser() re-validates against Supabase's servers — avoids the "insecure session" warning from getSession().
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {
      user: null,
      isAuthenticated: false,
      isApproved: false,
      isPending: false,
      isRevoked: false,
    };
  }

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });

  if (!user || user.role !== 'MAYORISTA') {
    return {
      user: null,
      isAuthenticated: false,
      isApproved: false,
      isPending: false,
      isRevoked: false,
    };
  }

  const isRevoked = user.revokedAt !== null;

  return {
    user,
    isAuthenticated: true,
    // The single flag that gates wholesale pricing, everywhere. Revoking sets
    // it to false, and it is re-read per request, so access stops immediately.
    isApproved: user.approved,
    isPending: !user.approved && !isRevoked,
    isRevoked,
  };
}
