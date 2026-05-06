import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

// GDPR / KVKK data portability — return everything we hold for the caller
// as a single JSON download. Caller must be authenticated.

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Same-origin check — defense in depth.
  const origin = request.headers.get('origin')
  const host = request.headers.get('host') ?? ''
  if (origin && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  }

  const allowed = await checkRateLimit(user.id, 'data_export', 5)
  if (!allowed) return NextResponse.json({ error: 'Too many export requests' }, { status: 429 })

  const admin = createAdminClient()

  const [
    profileRes,
    ideasRes,
    feedbacksRes,
    votesRes,
    bookmarksRes,
    notificationsRes,
    reportsRes,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin.from('ideas').select('*').eq('user_id', user.id).order('created_at'),
    admin.from('feedbacks').select('*').eq('user_id', user.id).order('created_at'),
    admin.from('votes').select('*').eq('user_id', user.id).order('created_at'),
    admin.from('bookmarks').select('*').eq('user_id', user.id).order('created_at'),
    admin.from('notifications').select('*').eq('user_id', user.id).order('created_at'),
    admin.from('reports').select('*').eq('reporter_user_id', user.id).order('created_at'),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    notice: 'This file contains every record we hold about your account on BullyMyIdea. Keep it safe.',
    account: {
      id: user.id,
      email: user.email ?? null,
      email_confirmed_at: user.email_confirmed_at ?? null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      provider: user.app_metadata?.provider ?? null,
      is_anonymous: !!user.is_anonymous,
    },
    profile: profileRes.data ?? null,
    ideas: ideasRes.data ?? [],
    feedbacks: feedbacksRes.data ?? [],
    votes: votesRes.data ?? [],
    bookmarks: bookmarksRes.data ?? [],
    notifications: notificationsRes.data ?? [],
    reports_filed: reportsRes.data ?? [],
  }

  const filename = `bullymyidea-export-${new Date().toISOString().slice(0, 10)}.json`
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
