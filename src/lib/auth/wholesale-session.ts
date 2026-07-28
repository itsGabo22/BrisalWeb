import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import type { User as PrismaUser } from '@prisma/client';

export interface WholesaleSessionResult {
  user: PrismaUser | null;
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
}

/** Resolves the current wholesale session from the Supabase auth cookie + the matching Prisma User row. */
export async function getSessionResult(): Promise<WholesaleSessionResult> {
  const supabase = await createClient();
  // getUser() re-validates against Supabase's servers — avoids the "insecure session" warning from getSession().
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { user: null, isAuthenticated: false, isApproved: false, isPending: false };
  }

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });

  if (!user || user.role !== 'MAYORISTA') {
    return { user: null, isAuthenticated: false, isApproved: false, isPending: false };
  }

  return {
    user,
    isAuthenticated: true,
    isApproved: user.approved,
    isPending: !user.approved,
  };
}
