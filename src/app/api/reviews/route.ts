import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAndUploadImage, slugifyFilename } from '@/lib/supabase/storage';
import { MAX_REVIEW_IMAGES, createReviewSchema } from '@/lib/validators';
import { publicReadErrorResponse } from '@/lib/public-errors';
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Public review submission. Deliberately unauthenticated: there is no general
 * customer login on this site, so requiring one would mean nobody could review.
 *
 * Every row is written PENDING and is invisible to shoppers until an admin
 * approves it — moderation is the spam gate, not a login. The checks below are
 * only there to keep obvious junk out of the queue the client has to read.
 */
export async function POST(request: Request) {
  /**
   * Deliberately unauthenticated (see above), so moderation is the only spam
   * gate — and a queue flooded with junk is a moderation gate nobody can use.
   * Five a DAY per connection: this endpoint also accepts up to four 8MB
   * uploads per call, which makes it the costliest thing a stranger can do.
   */
  const ip = getClientIp(request);
  if (ip) {
    const limit = await checkRateLimit(RATE_LIMITS.reviewCreate, `ip:${ip}`, ip);
    if (!limit.allowed) return rateLimitResponse(limit);
  }

  try {
    const formData = await request.formData();

    const parsed = createReviewSchema.safeParse({
      productId: formData.get('productId'),
      authorName: formData.get('authorName'),
      // FormData is all strings; the schema wants a real number so that "abc"
      // fails as a rating rather than sneaking through as NaN.
      rating: Number(formData.get('rating')),
      title: (formData.get('title') as string) || undefined,
      body: (formData.get('body') as string) || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { productId, authorName, rating, title, body } = parsed.data;

    // A review has to be attached to something real; a bad id is a bad request,
    // not a 500 from the foreign key.
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    /**
     * A review with a rating but no words at all is fine — plenty of people
     * only leave stars. What is rejected is a "written" review that is nothing
     * but punctuation or a single character, which is the cheapest junk to send
     * and the most annoying to moderate.
     */
    const written = `${title ?? ''} ${body ?? ''}`.trim();
    if (written.length > 0 && !/[\p{L}\p{N}]{2,}/u.test(written)) {
      return NextResponse.json(
        { error: 'Escribe un comentario real o déjalo en blanco' },
        { status: 400 },
      );
    }

    const files = formData
      .getAll('images')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length > MAX_REVIEW_IMAGES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_REVIEW_IMAGES} fotos por reseña` },
        { status: 400 },
      );
    }

    const imageUrls: string[] = [];
    const timestamp = Date.now();

    for (const [index, file] of files.entries()) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Cada foto debe pesar menos de 8MB' }, { status: 400 });
      }

      const baseName = slugifyFilename(file.name.replace(/\.[^.]+$/, '')) || 'foto';
      const buffer = Buffer.from(await file.arrayBuffer());
      /**
       * Routed through processAndUploadImage rather than uploading the raw file:
       * it does the sharp → WebP conversion AND the Blob wrap that Node 24's
       * undici needs, without which the stored file is corrupt on Vercel.
       * Customer photos are display-only, so 1200px is plenty.
       */
      const url = await processAndUploadImage(buffer, {
        bucket: 'review-images',
        path: `${product.slug}/${timestamp}-${index}-${baseName}.webp`,
        maxWidth: 1200,
        quality: 80,
      });
      imageUrls.push(url);
    }

    const review = await prisma.review.create({
      data: {
        productId,
        authorName,
        rating,
        title: title || null,
        body: body || null,
        imageUrls,
        // Explicit rather than leaning on the column default, so the one line
        // that matters most for this feature is visible at the call site.
        status: 'PENDING',
      },
    });

    // No revalidatePath here on purpose: a PENDING review changes nothing a
    // shopper can see, so busting the product page cache would be pure churn.
    // The admin's approve/reject is what revalidates.

    return NextResponse.json(
      { id: review.id, status: review.status },
      { status: 201 },
    );
  } catch (err) {
    console.error('[reviews] Error al crear la reseña:', err);
    return NextResponse.json({ error: 'No se pudo enviar la reseña' }, { status: 500 });
  }
}

/**
 * Approved reviews for one product. The product page renders its own on the
 * server, so this exists for the client to refresh without a full reload.
 */
export async function GET(request: Request) {
  try {
    const productId = new URL(request.url).searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'Falta productId' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      // Bounded: this is public and unauthenticated, and a product with a
      // thousand approved reviews should not serialise all of them into one
      // response because someone asked. The page renders its own set
      // server-side; this exists only for the client to refresh.
      take: 200,
    });

    return NextResponse.json(
      reviews.map((review) => ({
        id: review.id,
        authorName: review.authorName,
        rating: review.rating,
        title: review.title,
        body: review.body,
        imageUrls: review.imageUrls,
        createdAt: review.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    // The POST above had a try/catch from the start; this one never did, so a
    // failed read became an unhandled rejection and the reviews list silently
    // rendered empty with nothing logged under a findable tag.
    return publicReadErrorResponse('reviews', err, 'No se pudieron cargar las reseñas.');
  }
}
