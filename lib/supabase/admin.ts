import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Server-only admin client. Uses SERVICE_ROLE which BYPASSES RLS.
// Caller is fully responsible for verifying authorization. NEVER import
// from a client component.

let cached: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — admin client unavailable')
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
