import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. Bypasses RLS and can create/delete auth users.
 * Import ONLY from server-only code (Route Handlers) — never from a 'use client' file.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
