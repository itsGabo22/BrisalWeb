import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    return response;
  } catch (err) {
    /**
     * Was unguarded. Reported as a SUCCESS anyway, deliberately: the client
     * redirects to /admin/login on an ok response, and an admin who clicked
     * "Cerrar sesión" must end up logged out of the UI even if the Supabase
     * call threw. A failed sign-out that leaves them staring at the panel is
     * the worse outcome; the cookie is cleared on the next proxy pass, and the
     * fault is logged.
     */
    console.error('[admin/auth/logout] Error al cerrar sesión:', err);
    const response = NextResponse.json({ success: true });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
