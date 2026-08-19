import { NextResponse } from 'next/server';
import { adminReadErrorResponse } from '@/lib/admin/admin-errors';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'Admin API placeholder',
    });
  } catch (err) {
    return adminReadErrorResponse('admin', err);
  }
}
