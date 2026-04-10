import { createServerClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export function hashIP(ip: string): string {
  return createHash('sha256').update(ip + (process.env.RATE_LIMIT_SALT ?? 'bully')).digest('hex').slice(0, 16)
}

/**
 * Returns true if the request is within rate limit, false if blocked.
 * Window: 24 hours from first action.
 */
export async function checkRateLimit(
  ip: string,
  action: string,
  maxPerDay: number
): Promise<boolean> {
  const supabase = createServerClient()
  const ipHash = hashIP(ip)
  const windowStart = new Date()
  windowStart.setHours(0, 0, 0, 0) // start of today UTC

  const { data, error } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('ip_hash', ipHash)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())

  if (error) return true // fail open

  const total = data?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0
  if (total >= maxPerDay) return false

  // Increment counter
  await supabase.from('rate_limits').upsert(
    { ip_hash: ipHash, action, count: total + 1, window_start: windowStart.toISOString() },
    { onConflict: 'ip_hash,action,window_start', ignoreDuplicates: false }
  )

  return true
}
