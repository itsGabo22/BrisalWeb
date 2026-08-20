/**
 * Sliding-window rate limiting, backed by the `RateLimitHit` table.
 *
 * WHY A TABLE. There is no Redis, KV or Upstash configured for this project
 * (verified: nothing in package.json or .env.example), and provisioning one for
 * a shop this size would be infrastructure nobody maintains. A row per counted
 * request on six endpoints is well within what the existing Postgres handles,
 * and `pruneRateLimitHits` keeps the table from growing without bound.
 *
 * WHY SLIDING AND NOT FIXED-WINDOW. A fixed window ("20 per calendar hour")
 * lets an attacker send 20 at 10:59 and 20 more at 11:00 — double the intended
 * rate across two minutes. Counting rows newer than `now - window` has no such
 * boundary.
 *
 * WHAT THIS IS NOT. It is per-key, not global, and it is advisory: a determined
 * attacker with many IPs is not stopped by any of this. The goal is to make the
 * cheap abuse (a script hammering coupon codes, a bot filling the order table)
 * expensive enough not to bother, and to give admin login a real lockout.
 */
import { prisma } from '@/lib/prisma';

export interface RateLimitRule {
  /** Namespace, so two endpoints counting the same IP don't share a budget. */
  bucket: string;
  /** How many requests are allowed inside the window. */
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the window after this one. 0 when blocked. */
  remaining: number;
  /** Seconds until the oldest hit in the window expires. */
  retryAfterSeconds: number;
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/**
 * The rules, in one place so the limits are reviewable without reading six
 * route handlers. Tuned to be invisible to a real customer and annoying to a
 * script: nobody legitimately places ten orders an hour from one connection,
 * and nobody types twenty coupon codes.
 */
export const RATE_LIMITS = {
  /** Per EMAIL, not per IP — see `checkAdminLoginLockout`. */
  adminLogin: { bucket: 'admin-login', limit: 5, windowMs: 15 * MINUTE },
  couponValidate: { bucket: 'coupon-validate', limit: 20, windowMs: HOUR },
  orderCreate: { bucket: 'order-create', limit: 10, windowMs: HOUR },
  wholesaleRegister: { bucket: 'wholesale-register', limit: 5, windowMs: HOUR },
  reviewCreate: { bucket: 'review-create', limit: 5, windowMs: DAY },
  contact: { bucket: 'contact', limit: 5, windowMs: HOUR },
  productSearch: { bucket: 'product-search', limit: 120, windowMs: HOUR },
} as const satisfies Record<string, RateLimitRule>;

/**
 * The client's IP, or `null`.
 *
 * On Vercel `x-forwarded-for` is set by the platform and its LEFT-most entry is
 * the real client; taking the right-most (or trusting a bare `x-real-ip`) is how
 * a caller spoofs their own identity, because anything the client sends is
 * appended. `null` rather than a fake constant when nothing is present: callers
 * decide whether an unidentifiable request should be limited as one shared
 * bucket or let through, and silently lumping every header-less request under
 * "unknown" would let one bad actor lock out the rest.
 */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || null;
}

/** `<bucket>:<subject>` — the opaque key the table indexes on. */
function buildKey(bucket: string, subject: string): string {
  return `${bucket}:${subject}`;
}

/**
 * Counts this request against `rule` and records it.
 *
 * Read-then-write rather than one atomic statement, unlike `redeemCoupon`. The
 * race here is benign in a way the coupon race was not: two simultaneous
 * requests can both see "19 used" and both be allowed, so the true ceiling is
 * `limit + concurrency` rather than `limit`. Letting a 21st coupon attempt
 * through costs nothing; letting a 6th coupon REDEMPTION through oversells a
 * discount, which is why that one needed the atomic guard and this does not.
 *
 * FAILS OPEN. If the database is unreachable, this returns `allowed` rather
 * than locking every customer out of checkout. A rate limiter is a defence
 * against abuse, not a correctness invariant, and making it a hard dependency
 * of the order path would turn a transient DB hiccup into a total outage.
 * `checkAdminLoginLockout` deliberately does NOT share this behaviour.
 */
export async function checkRateLimit(
  rule: RateLimitRule,
  subject: string,
  ip: string | null = null,
): Promise<RateLimitResult> {
  const key = buildKey(rule.bucket, subject);
  const since = new Date(Date.now() - rule.windowMs);

  try {
    const hits = await prisma.rateLimitHit.findMany({
      where: { key, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    if (hits.length >= rule.limit) {
      // The window frees up when the OLDEST hit in it ages out, not a whole
      // window from now — otherwise a blocked caller is told to wait far longer
      // than they actually have to.
      const oldest = hits[0].createdAt.getTime();
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + rule.windowMs - Date.now()) / 1000),
      );
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    await prisma.rateLimitHit.create({ data: { key, ip } });
    void pruneRateLimitHits();

    return {
      allowed: true,
      remaining: rule.limit - hits.length - 1,
      retryAfterSeconds: 0,
    };
  } catch (err) {
    console.error('[rate-limit] check failed, allowing request:', err);
    return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 };
  }
}

/**
 * A 429 with `Retry-After`, in Spanish like every other customer-facing error
 * on this site. The message never says which limit was hit or how many attempts
 * remain — that is free reconnaissance for whoever is probing.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
      },
    },
  );
}

// ─── Admin login lockout ──────────────────────────────────────────────────────

/**
 * Whether this email is currently locked out, WITHOUT recording an attempt.
 *
 * Split from `checkRateLimit` because login counts FAILURES, not requests: a
 * legitimate admin logging in ten times a day must never approach the limit,
 * and only a wrong password should cost anything.
 *
 * Keyed on EMAIL rather than IP on purpose. Password guessing is per-account,
 * and an IP key is trivially defeated by rotating addresses while hammering one
 * inbox. The trade-off is a denial-of-service against a known admin email,
 * which is why the window is 15 minutes and not a day.
 *
 * FAILS CLOSED, unlike the public limiters: if the lockout state cannot be
 * read, the safe answer for an authentication endpoint is to refuse rather than
 * to wave through unlimited password guesses.
 */
export async function checkAdminLoginLockout(
  email: string,
): Promise<RateLimitResult> {
  const rule = RATE_LIMITS.adminLogin;
  const key = buildKey(rule.bucket, email.trim().toLowerCase());
  const since = new Date(Date.now() - rule.windowMs);

  try {
    const hits = await prisma.rateLimitHit.findMany({
      where: { key, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    if (hits.length >= rule.limit) {
      const oldest = hits[0].createdAt.getTime();
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((oldest + rule.windowMs - Date.now()) / 1000),
        ),
      };
    }

    return {
      allowed: true,
      remaining: rule.limit - hits.length,
      retryAfterSeconds: 0,
    };
  } catch (err) {
    console.error('[rate-limit] admin lockout check failed, denying:', err);
    return { allowed: false, remaining: 0, retryAfterSeconds: 60 };
  }
}

/**
 * Records one failed sign-in. The row is also the audit log — `ip` exists only
 * so the client can be told where the attempts came from after the fact.
 */
export async function recordFailedAdminLogin(
  email: string,
  ip: string | null,
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  console.warn(
    `[admin-login] intento fallido para ${normalized} desde ${ip ?? 'IP desconocida'}`,
  );
  try {
    await prisma.rateLimitHit.create({
      data: { key: buildKey(RATE_LIMITS.adminLogin.bucket, normalized), ip },
    });
    void pruneRateLimitHits();
  } catch (err) {
    console.error('[rate-limit] could not record failed login:', err);
  }
}

/** Clears the failure count for an email — called on a successful sign-in. */
export async function clearAdminLoginAttempts(email: string): Promise<void> {
  try {
    await prisma.rateLimitHit.deleteMany({
      where: {
        key: buildKey(RATE_LIMITS.adminLogin.bucket, email.trim().toLowerCase()),
      },
    });
  } catch (err) {
    console.error('[rate-limit] could not clear login attempts:', err);
  }
}

// ─── Housekeeping ─────────────────────────────────────────────────────────────

/** Longest window in use, so pruning can never delete a row still being counted. */
const MAX_WINDOW_MS = Math.max(
  ...Object.values(RATE_LIMITS).map((rule) => rule.windowMs),
);

let lastPruneAt = 0;
const PRUNE_INTERVAL_MS = 10 * MINUTE;

/**
 * Deletes rows older than the longest window, at most once every ten minutes
 * per server instance.
 *
 * Opportunistic rather than a cron because there is no scheduler in this
 * project and this table only grows when the guarded endpoints are hit — so the
 * traffic that creates rows is exactly the traffic that cleans them up.
 * Deliberately not awaited by callers: a slow delete must not add latency to a
 * customer's checkout, and a failed prune is harmless.
 */
export async function pruneRateLimitHits(): Promise<void> {
  const now = Date.now();
  if (now - lastPruneAt < PRUNE_INTERVAL_MS) return;
  lastPruneAt = now;

  try {
    await prisma.rateLimitHit.deleteMany({
      where: { createdAt: { lt: new Date(now - MAX_WINDOW_MS) } },
    });
  } catch (err) {
    console.error('[rate-limit] prune failed:', err);
  }
}
