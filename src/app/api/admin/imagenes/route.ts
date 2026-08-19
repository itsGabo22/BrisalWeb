import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminReadErrorResponse } from '@/lib/admin/admin-errors';

const PAGE_SIZE = 48;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedParam = searchParams.get('assigned');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);

    const where =
      assignedParam === null
        ? {}
        : { assigned: assignedParam === 'true' };

    const [images, total] = await Promise.all([
      prisma.imageBandeja.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.imageBandeja.count({ where }),
    ]);

    return NextResponse.json({
      images,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (err) {
    return adminReadErrorResponse('admin/imagenes', err);
  }
}
