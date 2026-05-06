import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { LIMITS } from '@/lib/limits'
import { isReservedUsername } from '@/lib/reserved'

function sanitizeUsername(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, LIMITS.username.max)
  // Reject reserved → returns empty so the fallback chain below kicks in.
  return isReservedUsername(cleaned) ? '' : cleaned
}

export async function POST() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Source priority: user_metadata.username (sanitized) → email prefix → user-id fallback.
  const meta = sanitizeUsername(String(user.user_metadata?.username ?? ''))
  const fromEmail = user.email ? sanitizeUsername(user.email.split('@')[0]) : ''
  const fallback = `user_${user.id.slice(0, 8)}`
  const username = (meta.length >= LIMITS.username.min ? meta : null)
    ?? (fromEmail.length >= LIMITS.username.min ? fromEmail : null)
    ?? fallback

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .upsert({ id: user.id, username }, { onConflict: 'id', ignoreDuplicates: true })

  if (error) {
    console.error('setup-profile error:', error)
    return NextResponse.json({ error: 'Profile setup failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
