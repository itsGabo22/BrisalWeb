import { NextResponse } from 'next/server';
import { getSessionResult } from '@/lib/auth/wholesale-session';

export async function GET() {
  const { user, isAuthenticated, isApproved } = await getSessionResult();

  return NextResponse.json({
    authenticated: isAuthenticated,
    approved: isApproved,
    userId: user?.id ?? null,
  });
}
