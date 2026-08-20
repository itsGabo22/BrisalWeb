import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

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
