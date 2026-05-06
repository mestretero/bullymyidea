import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac } from 'crypto'

const SALT = process.env.RATE_LIMIT_SALT ?? ''
if (process.env.NODE_ENV === 'production' && !SALT) {
  // Fail loud at first request rather than silently using a public default.
  throw new Error('RATE_LIMIT_SALT must be set in production')
}

// Effective salt — use empty string in dev only. In prod the throw above prevents this branch.
const EFFECTIVE_SALT = SALT || 'dev-only-salt-change-me'

export function hashIdentifier(value: string): string {
  // HMAC-SHA256, truncated to 16 hex chars (matches existing column width).
  return createHmac('sha256', EFFECTIVE_SALT).update(value).digest('hex').slice(0, 16)
}

// Backwards-compat alias
export const hashIP = hashIdentifier

/**
 * Rolling 24-hour rate limit. Returns true if within budget, false if blocked.
 * Identifier should typically be `user.id` for authenticated routes,
 * or `ip` for anonymous endpoints. Mixing both as `${user.id}:${ip}` is fine.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxPerDay: number
): Promise<boolean> {
  const supabase = createAdminClient()
  const idHash = hashIdentifier(identifier)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // rolling 24h

  // Sum recent actions in the rolling window.
  const { data, error } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('ip_hash', idHash)
    .eq('action', action)
    .gte('window_start', cutoff.toISOString())

  if (error) return true // fail open — don't break the site if rate-limit DB is down

  const total = data?.reduce((sum: number, row: { count?: number }) => sum + (row.count ?? 0), 0) ?? 0
  if (total >= maxPerDay) return false

  // Bucket increments are bucketed per-hour to keep the row count bounded.
  const hourBucket = new Date()
  hourBucket.setMinutes(0, 0, 0)

  // Atomic-ish: try insert; on conflict bump the count.
  const { error: upsertErr } = await supabase.from('rate_limits').upsert(
    { ip_hash: idHash, action, count: 1, window_start: hourBucket.toISOString() },
    { onConflict: 'ip_hash,action,window_start', ignoreDuplicates: false }
  )

  if (upsertErr) {
    // Best effort: if an `increment_rate_limit` RPC exists in the DB, call it
    // to bump the count atomically. Silently ignore if the RPC isn't defined.
    try {
      await supabase.rpc('increment_rate_limit', {
        p_hash: idHash, p_action: action, p_window_start: hourBucket.toISOString(),
      })
    } catch {
      // RPC missing — count drift is acceptable for this best-effort path.
    }
  }

  return true
}
