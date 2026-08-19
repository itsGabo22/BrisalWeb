import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { adminReadErrorResponse } from '@/lib/admin/admin-errors';

/** Admin-gated by `src/proxy.ts`, which guards every `/api/admin` path. */
export const dynamic = 'force-dynamic';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
type Status = (typeof STATUSES)[number];

function parseStatus(value: string | null): Status | null {
  return STATUSES.includes(value as Status) ? (value as Status) : null;
}

export async function GET(request: Request) {
  try {
    const status = parseStatus(new URL(request.url).searchParams.get('status'));

    const where: Prisma.ReviewWhereInput = status ? { status } : {};

    const [reviews, counts] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        // The queue is unreadable without knowing WHICH product is being
        // reviewed, so the product comes along rather than being fetched per row.
        include: { product: { select: { name: true, slug: true, imageUrls: true } } },
      }),
      prisma.review.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const byStatus = Object.fromEntries(
      STATUSES.map((s) => [s, counts.find((c) => c.status === s)?._count._all ?? 0]),
    ) as Record<Status, number>;

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        productId: review.productId,
        productName: review.product.name,
        productSlug: review.product.slug,
        productImageUrl: review.product.imageUrls[0] ?? null,
        authorName: review.authorName,
        rating: review.rating,
        title: review.title,
        body: review.body,
        imageUrls: review.imageUrls,
        status: review.status,
        createdAt: review.createdAt.toISOString(),
      })),
      counts: {
        ...byStatus,
        ALL: byStatus.PENDING + byStatus.APPROVED + byStatus.REJECTED,
      },
    });
  } catch (err) {
    return adminReadErrorResponse('admin/resenas', err);
  }
}
