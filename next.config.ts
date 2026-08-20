import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

/**
 * Origins the browser is actually allowed to fetch from.
 *
 * Derived from the Supabase URL rather than hardcoded, so a project swap can't
 * leave a CSP pointing at the old storage bucket. Empty-string fallback keeps
 * the directive well-formed when the env var is absent (local tooling, CI),
 * where the only cost is that Supabase images would be blocked.
 */
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : '';
const supabaseWs = supabaseOrigin.replace(/^https:/, 'wss:');
const isDev = process.env.NODE_ENV === 'development';

/**
 * Content-Security-Policy, tailored to what this site genuinely loads.
 *
 * What it DOES buy: no external script/style/font/image origin can be pulled
 * in, the site cannot be framed, plugins and <base> hijacking are dead, and
 * forms cannot post off-origin.
 *
 * What it does NOT buy, honestly: `script-src` carries 'unsafe-inline' because
 * the App Router emits inline bootstrap and streaming payload scripts, and
 * without per-request nonces there is no way to allow those and forbid an
 * injected one. So this is not a strong XSS barrier -- it is defence in depth
 * behind React's own escaping (there is no dangerouslySetInnerHTML anywhere in
 * this codebase, which is what actually keeps injected markup out). Upgrading
 * to a nonce CSP means generating one in `src/proxy.ts` per request and
 * threading it through; worth doing, deliberately not bundled into a security
 * pass whose other changes must not be able to white-screen the site.
 *
 * Notes on specific directives:
 *   • 'unsafe-eval' in DEV only -- Turbopack's HMR needs it, production does not.
 *   • next/font/google SELF-HOSTS the font files at build time, so there is no
 *     fonts.googleapis.com entry to make: the faces come from /_next/static.
 *   • media-src carries the Supabase origin because the hero and section videos
 *     stream from storage, and blob: because the admin previews a local file
 *     before uploading it.
 *   • connect-src needs wss: for supabase-js, which may open a realtime socket
 *     even where this app does not use one.
 *   • instagram/tiktok/wa.me are plain <a> links, i.e. navigations rather than
 *     subresource loads, so they need no directive. form-action stays 'self'
 *     because nothing here posts to them.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
  `media-src 'self' blob: ${supabaseOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}`.trim(),
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Redundant with frame-ancestors above for modern browsers, kept for older
  // ones that understand only this.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Sends the full URL same-origin, bare origin cross-origin, nothing on a
  // downgrade -- so an outbound click can never leak a path or query string.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nothing on this site uses these; denying them means an injected iframe or
  // script cannot prompt for them either.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

const nextConfig: NextConfig = {
  /**
   * Forces sharp's native binary (and its libvips .so files, which live in a
   * SIBLING @img/ package, not nested under sharp/) into every route's
   * serverless bundle.
   *
   * This is the fix for a real production incident, twice now: uploads that
   * call `processAndUploadImage` failed with
   * `ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file`
   * -- confirmed from an actual Vercel runtime log, not inferred. That error
   * means the file is MISSING from the deployed function, not that the wrong
   * version was installed (a version mismatch fails differently). Pinning
   * sharp's optional platform dependencies in package.json (see the git log)
   * fixes what gets INSTALLED at build time; it does nothing about what
   * Vercel's file tracer decides to SHIP into each function, which is a
   * separate step and where this was actually still failing.
   *
   * The tracer is heuristic, and sharp is exactly the case Next's own docs
   * name as commonly missed -- doubly so here, since `loadSharp()` in
   * src/lib/supabase/storage.ts calls `import('sharp')` INSIDE a function
   * rather than as a static top-level import (deliberately, so a broken
   * binary can only break image uploads and not crash every route that
   * transitively imports that file — see that file's own comment). A dynamic,
   * conditionally-reached import is harder for static trace analysis to
   * follow than a static one, which is exactly the gap this closes.
   *
   * `'/*'` (every route) rather than naming each of the ten or so routes that
   * happen to import this today: that list has already grown twice without
   * anyone updating a route-scoped include, and the cost of over-including a
   * few native binary files on every route is negligible next to a 500 on
   * whichever route is added next.
   */
  outputFileTracingIncludes: {
    '/*': ['node_modules/sharp/**/*', 'node_modules/@img/**/*'],
  },
  /**
   * HSTS is applied HERE rather than in `securityHeaders` because it must only
   * ever go out over HTTPS -- sending it in local development would pin
   * localhost to https in the browser for a year and make the dev server
   * unreachable until the pin is manually cleared.
   *
   * Vercel does not add HSTS to custom domains by default (it does on
   * *.vercel.app), so this is not a duplicate. Should a duplicate ever appear,
   * browsers honour the first and the two values here agree anyway.
   *
   * Deliberately WITHOUT `includeSubDomains` or `preload`: both are commitments
   * that every present and future subdomain is HTTPS-only, and `preload` is
   * effectively irreversible once submitted. Add them once that is confirmed --
   * it is a domain-ownership decision, not a code one.
   */
  async headers() {
    return [
      {
        // Every route, including /api and /admin.
        source: '/:path*',
        headers: process.env.NODE_ENV === 'production'
          ? [
              ...securityHeaders,
              { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
            ]
          : securityHeaders,
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: supabaseHostname
      ? [{ protocol: 'https', hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
};

export default nextConfig;
