import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Hard delete — cascades through FK to profiles/ideas/feedbacks/votes/bookmarks/notifications.
// Requires both an active session AND a fresh password re-verification: a stolen
// session cookie alone cannot destroy the account.

export async function DELETE(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Origin check — extra CSRF defence on a destructive route.
  const origin = request.headers.get('origin') ?? ''
  const host = request.headers.get('host') ?? ''
  if (origin && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  }

  // Rate cap.
  const allowed = await checkRateLimit(user.id, 'account_delete', 3)
  if (!allowed) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })

  // Re-verify password. Anonymous users have no email/password — refuse those.
  const body = await request.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''
  if (!user.email || !password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  // Use a throwaway client (no cookies, no session persistence) so the live
  // server-side cookies aren't rotated mid-flow. If we used `supabase` here,
  // the password check would issue a NEW JWT into the response cookies and
  // we'd be acting on rotated tokens while admin.deleteUser strips the user.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }
  const verifyClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: authErr } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (authErr) return NextResponse.json({ error: 'Password incorrect' }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('account/delete: SUPABASE_SERVICE_ROLE_KEY missing')
    return NextResponse.json({ error: 'Server not configured for deletion' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('account delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
