import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'
import { logAdminAction } from '@/lib/admin-audit'
import { isUuid } from '@/lib/sanitize'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const admin = createAdminClient()

  const [{ data: authUser, error: authErr }, profileRes, ideasRes, feedbacksRes, votesRes] = await Promise.all([
    admin.auth.admin.getUserById(params.id),
    admin.from('profiles').select('*').eq('id', params.id).single(),
    admin
      .from('ideas')
      .select('id, title, status, created_at, category, tags, media_urls, feedback_count:feedbacks(count)')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false }),
    admin
      .from('feedbacks')
      .select('id, idea_id, strengths, weaknesses, suggestions, created_at, votes(vote_type)')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', params.id),
  ])

  if (authErr || !authUser?.user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const u = authUser.user
  const p: any = profileRes.data ?? {}

  const ideas = (ideasRes.data ?? []).map((i: any) => ({
    ...i,
    feedback_count: i.feedback_count?.[0]?.count ?? 0,
  }))

  const feedbacks = (feedbacksRes.data ?? []).map((fb: any) => {
    const votes = (fb.votes ?? []) as { vote_type: string }[]
    return {
      ...fb,
      votes: undefined,
      vote_counts: {
        up: votes.filter(v => v.vote_type === 'up').length,
        down: votes.filter(v => v.vote_type === 'down').length,
      },
    }
  })

  // Hydrate idea titles for feedbacks
  const feedbackIdeaIds = Array.from(new Set(feedbacks.map(f => f.idea_id).filter(Boolean) as string[]))
  let ideaTitleMap = new Map<string, string>()
  if (feedbackIdeaIds.length) {
    const { data: ideaList } = await admin.from('ideas').select('id, title').in('id', feedbackIdeaIds)
    ideaTitleMap = new Map((ideaList ?? []).map((i: any) => [i.id, i.title]))
  }
  const feedbacksHydrated = feedbacks.map(f => ({ ...f, idea_title: ideaTitleMap.get(f.idea_id) ?? null }))

  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email ?? null,
      username: p.username ?? null,
      avatar_url: p.avatar_url ?? null,
      bio: p.bio ?? null,
      is_admin: !!p.is_admin,
      is_anonymous: !!u.is_anonymous,
      email_confirmed_at: u.email_confirmed_at ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      provider: u.app_metadata?.provider ?? null,
    },
    ideas,
    feedbacks: feedbacksHydrated,
    counts: {
      ideas_active: ideas.filter(i => i.status === 'active').length,
      ideas_archived: ideas.filter(i => i.status === 'archived').length,
      feedbacks_given: feedbacksHydrated.length,
      votes_cast: votesRes.count ?? 0,
    },
  })
}

// DELETE — hard-remove the user account (admin action, e.g. for spam / abuse).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  if (params.id === me.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(params.id)
  if (error) {
    console.error('admin user delete:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
  await logAdminAction({ adminId: me.id, action: 'user_delete', targetType: 'user', targetId: params.id })
  return NextResponse.json({ ok: true })
}
