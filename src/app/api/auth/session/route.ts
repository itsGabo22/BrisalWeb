import { NextResponse } from 'next/server';
import { getSessionResult } from '@/lib/auth/wholesale-session';

export async function GET() {
  const { isAuthenticated, isApproved } = await getSessionResult();

  return NextResponse.json({
    authenticated: isAuthenticated,
    approved: isApproved,
  });
}
