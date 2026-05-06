import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { LIMITS } from '@/lib/limits'
import { isAllowedAvatarUrl } from '@/lib/storage'
import { checkRateLimit } from '@/lib/rate-limit'
import { cleanField } from '@/lib/sanitize'
import { isReservedUsername } from '@/lib/reserved'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (user.id !== params.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const allowed = await checkRateLimit(user.id, 'profile_update', 30)
  if (!allowed) return NextResponse.json({ error: 'Too many profile updates' }, { status: 429 })

  const body = await request.json().catch(() => ({}))
  const username = typeof body.username === 'string'
    ? body.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, LIMITS.username.max)
    : undefined
  const bio = body.bio !== undefined ? cleanField(body.bio, LIMITS.bio) : undefined
  const avatar_url = typeof body.avatar_url === 'string' ? body.avatar_url.trim() : undefined

  if (username !== undefined && username.length < LIMITS.username.min) {
    return NextResponse.json({ error: `Username must be at least ${LIMITS.username.min} characters` }, { status: 400 })
  }
  if (username !== undefined && isReservedUsername(username)) {
    return NextResponse.json({ error: 'Username is reserved' }, { status: 400 })
  }
  if (avatar_url !== undefined && avatar_url && !isAllowedAvatarUrl(avatar_url)) {
    return NextResponse.json({ error: 'Avatar URL not allowed' }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (username !== undefined) updates.username = username
  if (bio !== undefined) updates.bio = bio
  if (avatar_url !== undefined) updates.avatar_url = avatar_url

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update(updates).eq('id', params.id)
  if (error) {
    console.error('profiles update error:', error)
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
