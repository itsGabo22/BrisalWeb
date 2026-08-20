import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  RATE_LIMITS,
  checkAdminLoginLockout,
  clearAdminLoginAttempts,
  getClientIp,
  recordFailedAdminLogin,
} from '@/lib/rate-limit';

/**
 * Admin sign-in, server-side — the only reason this route exists.
 *
 * The login page used to call `supabase.auth.signInWithPassword` straight from
 * the browser. That works, but it means the request never touches this
 * application, so there is nowhere to count failed attempts and nothing that
 * can enforce a lockout. Password guessing was bounded only by whatever
 * Supabase's own auth throttling happens to be.
 *
 * WHY IT LIVES OUTSIDE `/api/admin/**`. `src/proxy.ts` answers 401 to that
 * whole prefix unless the caller is already an admin, which a person trying to
 * log in is by definition not. Adding an exemption to the gate would mean
 * poking a hole in the one piece of code that protects every admin route — a
 * far worse trade than putting the login endpoint at a path that is public by
 * design, which a login endpoint has to be anyway.
 *
 * `runtime = 'nodejs'` because the lockout reads Prisma.
 */
export const runtime = 'nodejs';

const adminLoginSchema = z.object({
  email: z.string().trim().email().max(200),
  // Only a floor and a ceiling. This is a sign-in, not a sign-up: complexity
  // rules here would just leak what the real password looks like, and the
  // ceiling exists so a megabyte of "password" is rejected before bcrypt.
  password: z.string().min(1).max(200),
});

/**
 * One message for every failure mode: wrong password, unknown email, correct
 * password on a non-admin account. Distinguishing them tells an attacker which
 * emails are real admins, which is the most useful thing they could learn here.
 */
const GENERIC_ERROR = 'Credenciales incorrectas.';

export async function POST(request: Request) {
  const ip = getClientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    // Not the Zod field detail the admin routes return: a malformed login body
    // gets the same opaque answer as a wrong password.
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const { email, password } = parsed.data;

  /**
   * Checked BEFORE the password is ever handed to Supabase, so a locked-out
   * email costs an attacker a cheap 429 instead of a real authentication
   * attempt. Keyed on email — see `checkAdminLoginLockout` for why that beats
   * keying on IP for credential guessing.
   */
  const lockout = await checkAdminLoginLockout(email);
  if (!lockout.allowed) {
    const minutes = Math.max(1, Math.ceil(lockout.retryAfterSeconds / 60));
    return NextResponse.json(
      {
        error: `Demasiados intentos fallidos. Vuelve a intentarlo en ${minutes} ${
          minutes === 1 ? 'minuto' : 'minutos'
        }.`,
      },
      { status: 429, headers: { 'Retry-After': String(lockout.retryAfterSeconds) } },
    );
  }

  try {
    // The SERVER client, so `@supabase/ssr` writes the session cookies onto
    // this response — that is what makes the browser authenticated afterwards
    // without the password ever being handled by our own code beyond this call.
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      await recordFailedAdminLogin(email, ip);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    /**
     * Right password, wrong role. This counts as a failed attempt and signs the
     * session straight back out: without the sign-out the caller would keep a
     * valid non-admin session cookie minted by this endpoint, and without the
     * count a non-admin account becomes an unlimited oracle for guessing.
     */
    if (data.user.user_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      await recordFailedAdminLogin(email, ip);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 });
    }

    // Success wipes the counter, so an admin who mistyped four times and then
    // got it right starts clean rather than one attempt from a lockout.
    await clearAdminLoginAttempts(email);

    const response = NextResponse.json({ success: true });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    console.error('[auth/admin-login] Error al iniciar sesión:', err);
    return NextResponse.json(
      { error: 'No se pudo iniciar sesión. Inténtalo de nuevo.' },
      { status: 500 },
    );
  }
}

/** Exported for the report/tests — the lockout the route enforces. */
export const ADMIN_LOGIN_LIMIT = RATE_LIMITS.adminLogin;
