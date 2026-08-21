/**
 * Typo-tolerant product search ranking.
 *
 * The contract requires a search that tolerates spelling mistakes. Before
 * this, `search` / `searchPreview` were a plain `contains` + `mode:
 * 'insensitive'` scan, so "colar" found nothing at all while "Collar Perlas"
 * sat in the catalog.
 *
 * This module answers one question — "which product ids match, best first?" —
 * and nothing else. The repository hydrates the ids it returns, so the ranking
 * rules live in exactly one place and both the type-ahead preview and the full
 * results page are guaranteed to agree on what "matching" and "best" mean.
 * Returning ids rather than rows is also what keeps the preview cheap: only the
 * six it shows get their relations loaded.
 *
 * The pg_trgm extension and the GIN index this leans on are applied by
 * prisma/sql/2026-08-21-search-trigram.sql, which also records the measurements
 * behind the threshold below.
 */
import { prisma } from '@/lib/prisma';

/**
 * How similar a name has to be to count as a fuzzy hit, 0–1.
 *
 * 0.4, measured against the real catalog rather than guessed: every genuine
 * typo tested scored at least 0.444 ("tureco" → "Pulsera ojo turco") and the
 * one false positive — "colar" → "Anillo corazón angelical" — scored 0.333, so
 * 0.4 sits in the gap between them. Raising it starts dropping real typos;
 * lowering it starts admitting words that merely share a few letters.
 *
 * Lives here rather than in the SQL file so it can be tuned without a database
 * change; it is passed as a bound parameter.
 */
export const SIMILARITY_THRESHOLD = 0.4;

/**
 * Escapes the wildcards ILIKE would otherwise honour.
 *
 * Prisma's `contains` does this internally; a raw ILIKE does not. Without it a
 * shopper typing "%" matches the entire catalog and "_" matches any single
 * character — not an injection (the value is still a bound parameter), but a
 * search box that quietly lies about what it found.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Product ids matching `query`, most relevant first.
 *
 * ── Ranking ──────────────────────────────────────────────────────────────────
 * Exact substring matches rank ABOVE every fuzzy match, always. Someone who
 * types a name correctly must not have their result pushed down the list by a
 * different product that happens to score well on trigrams — the fuzzy pass
 * fills in behind the literal hits, it does not compete with them. Within each
 * of those two bands the trigram score orders the rows, and `createdAt` breaks
 * remaining ties so the order is stable rather than whatever the planner
 * returns.
 *
 * ── Fuzzy on `name` only ─────────────────────────────────────────────────────
 * Substring matching still covers name AND description, unchanged. Trigram
 * similarity is applied to the name alone: against a paragraph-length
 * description the score is dominated by words the query never mentioned, so
 * fuzzy-matching it yields noise instead of results.
 *
 * `word_similarity(query, name)` alongside plain `similarity` is what makes
 * multi-word names work. `similarity('Collar maximalista', 'colar')` is only
 * 0.250 — below any usable threshold — because the whole string is in the
 * denominator; `word_similarity` scores the query against the best-matching
 * word inside the name instead and returns 0.625. Without it, a one-word typo
 * would be silently penalised for every OTHER word in the product's name.
 */
export async function findRankedProductIds(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = `%${escapeLikePattern(trimmed)}%`;

  /**
   * A tagged template, so `trimmed` and `pattern` cross as bound parameters.
   * Never `$queryRawUnsafe` with a concatenated needle — this string comes
   * straight from a public, unauthenticated search box.
   *
   * The threshold is cast explicitly: `similarity()` returns `real`, and
   * Postgres has no `real >= numeric` operator for the type the driver would
   * otherwise infer for a fractional parameter.
   */
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id
      FROM "Product" p
     WHERE p.active = true
       AND (
             p.name ILIKE ${pattern}
          OR COALESCE(p.description, '') ILIKE ${pattern}
          OR GREATEST(
               similarity(p.name, ${trimmed}),
               word_similarity(${trimmed}, p.name)
             ) >= CAST(${SIMILARITY_THRESHOLD} AS real)
       )
     ORDER BY
       (
         p.name ILIKE ${pattern}
         OR COALESCE(p.description, '') ILIKE ${pattern}
       ) DESC,
       GREATEST(
         similarity(p.name, ${trimmed}),
         word_similarity(${trimmed}, p.name)
       ) DESC,
       p."createdAt" DESC
  `;

  return rows.map((row) => row.id);
}
