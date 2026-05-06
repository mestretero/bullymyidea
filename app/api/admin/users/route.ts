import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'

export async function GET(request: Request) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const perPage = 50

  const admin = createAdminClient()

  // Page through auth.users (sorted by created_at desc by default)
  const { data: usersResp, error: usersErr } = await admin.auth.admin.listUsers({ page, perPage })
  if (usersErr) {
    console.error('admin users list:', usersErr)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  const users = usersResp?.users ?? []
  const ids = users.map(u => u.id)
  if (!ids.length) return NextResponse.json({ users: [], total: 0, page, per_page: perPage })

  // Profiles for usernames + avatars + admin flag
  const { data: profilesData } = await admin
    .from('profiles')
    .select('id, username, avatar_url, is_admin, bio')
    .in('id', ids)
  const profileMap = new Map((profilesData ?? []).map((p: any) => [p.id, p]))

  // Idea + feedback counts per user
  const [ideaRows, feedbackRows] = await Promise.all([
    admin.from('ideas').select('user_id, status').in('user_id', ids),
    admin.from('feedbacks').select('user_id').in('user_id', ids),
  ])
  const ideaCount = new Map<string, number>()
  const archivedCount = new Map<string, number>()
  for (const r of (ideaRows.data ?? []) as any[]) {
    if (!r.user_id) continue
    if (r.status === 'archived') {
      archivedCount.set(r.user_id, (archivedCount.get(r.user_id) ?? 0) + 1)
    } else {
      ideaCount.set(r.user_id, (ideaCount.get(r.user_id) ?? 0) + 1)
    }
  }
  const fbCount = new Map<string, number>()
  for (const r of (feedbackRows.data ?? []) as any[]) {
    if (!r.user_id) continue
    fbCount.set(r.user_id, (fbCount.get(r.user_id) ?? 0) + 1)
  }

  const hydrated = users.map(u => {
    const p: any = profileMap.get(u.id) ?? {}
    return {
      id: u.id,
      email: u.email ?? null,
      username: p.username ?? null,
      avatar_url: p.avatar_url ?? null,
      bio: p.bio ?? null,
      is_admin: !!p.is_admin,
      is_anonymous: !!u.is_anonymous,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      ideas_active: ideaCount.get(u.id) ?? 0,
      ideas_archived: archivedCount.get(u.id) ?? 0,
      feedbacks_given: fbCount.get(u.id) ?? 0,
    }
  })

  // Total count via separate API call (Supabase auth doesn't return total in listUsers).
  return NextResponse.json({
    users: hydrated,
    page,
    per_page: perPage,
    has_more: users.length === perPage,
  })
}
