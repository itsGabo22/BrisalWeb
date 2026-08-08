/**
 * Review reads for the storefront.
 *
 * Everything here filters on `status: 'APPROVED'` — a PENDING or REJECTED
 * review must never reach a shopper. That is enforced twice on purpose: here in
 * the query, and again by the `Review` table's RLS policy, which only lets the
 * anon role SELECT approved rows. Prisma connects as the table owner and
 * bypasses RLS, so this filter is the one that actually does the work on these
 * paths; the policy is the backstop for anything reaching Postgres through
 * Supabase's anon key.
 */
import type { Review as PrismaReview } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { RatingSummary, Review } from '@/types';

export function toReview(review: PrismaReview): Review {
  return {
    id: review.id,
    productId: review.productId,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    imageUrls: review.imageUrls,
    status: review.status,
    // Serialised here: a Date crossing into a Client Component arrives as a
    // string anyway, and leaving it typed as Date is a lie the compiler accepts.
    createdAt: review.createdAt.toISOString(),
  };
}

/** A product's approved reviews, newest first. */
export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const reviews = await prisma.review.findMany({
    where: { productId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
  });
  return reviews.map(toReview);
}

/** Average + count over one product's approved reviews. */
export async function getRatingSummary(productId: string): Promise<RatingSummary> {
  const result = await prisma.review.aggregate({
    where: { productId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    average: result._avg.rating ?? null,
    count: result._count._all,
  };
}

/**
 * Rating summaries for many products at once, keyed by product id.
 *
 * One groupBy for the whole listing rather than a query per card — the same
 * shape as `attachScopedDiscounts`, which already pays one extra round trip per
 * fetch regardless of how many products came back.
 *
 * Products with no approved reviews are simply absent from the map, which is
 * what lets the card render nothing at all rather than an empty five stars.
 */
export async function getRatingSummaries(
  productIds: string[],
): Promise<Map<string, RatingSummary>> {
  if (productIds.length === 0) return new Map();

  const grouped = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds }, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return new Map(
    grouped.map((row) => [
      row.productId,
      { average: row._avg.rating ?? null, count: row._count._all },
    ]),
  );
}
