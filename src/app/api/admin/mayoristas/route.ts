import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toWholesaler } from '@/lib/repositories/mappers';
import { adminReadErrorResponse } from '@/lib/admin/admin-errors';

export async function GET() {
  try {
    const wholesalers = await prisma.user.findMany({
      where: { role: 'MAYORISTA' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(wholesalers.map(toWholesaler));
  } catch (err) {
    return adminReadErrorResponse('admin/mayoristas', err);
  }
}
