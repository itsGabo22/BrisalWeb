import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isAdmin = user?.user_metadata?.role === 'admin';

  if (pathname === '/admin/login') {
    if (isAdmin) {
      const redirect = NextResponse.redirect(new URL('/admin', request.url));
      redirect.headers.set('Cache-Control', NO_STORE_HEADERS['Cache-Control']);
      return redirect;
    }
    return response;
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      const loginUrl = new URL('/admin/login', request.url);
      const redirect = NextResponse.redirect(loginUrl);
      redirect.headers.set('Cache-Control', NO_STORE_HEADERS['Cache-Control']);
      return redirect;
    }
  }

  return response;
}

export const config = {
  // Runs on every route (except static assets) so the Supabase session cookie
  // stays refreshed everywhere, not just on /admin.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
