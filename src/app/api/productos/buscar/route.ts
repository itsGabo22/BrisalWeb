import { NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories';
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';

const PREVIEW_LIMIT = 6;

/**
 * Longest query worth running. The repository does two `contains` scans, and a
 * multi-kilobyte needle is never a real search — it is someone seeing how much
 * work one request can buy. Truncated rather than rejected: a legitimate paste
 * of something over-long should still return its first hits.
 */
const MAX_QUERY_LENGTH = 80;

export async function GET(request: Request) {
  /**
   * The search-as-you-type box fires per keystroke, so the limit is generous
   * (120/hour) — enough for several real sessions, and still a ceiling on a
   * script looping this endpoint. It is worth having one at all because each
   * call runs two case-insensitive `contains` scans over the catalog.
   */
  const ip = getClientIp(request);
  if (ip) {
    const limit = await checkRateLimit(RATE_LIMITS.productSearch, `ip:${ip}`, ip);
    if (!limit.allowed) return rateLimitResponse(limit);
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH);

    if (!query) {
      return NextResponse.json({ products: [] });
    }

    /**
     * `searchPreview` rather than `search`: the old call fetched EVERY match
     * with all of its relations (variants, tags, materials) and then threw away
     * all but six here. On a growing catalog that is the whole table, with
     * joins, on an unauthenticated endpoint — the limit belongs in the query.
     *
     * `total` is now a separate COUNT, which is what the caller actually wants
     * ("6 shown of 23") and costs a fraction of materialising the rows.
     */
    const { products, total } = await productRepository.searchPreview(
      query,
      PREVIEW_LIMIT,
    );

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        imageUrl: product.imageUrls[0] ?? null,
      })),
      total,
    });
  } catch (err) {
    // Was missing entirely: any database fault became an unhandled rejection,
    // Next answered with its own opaque 500, and the search box silently showed
    // nothing with no tagged log to find afterwards.
    console.error('[productos/buscar] Error al buscar productos:', err);
    return NextResponse.json(
      { error: 'No se pudo completar la búsqueda' },
      { status: 500 },
    );
  }
}
