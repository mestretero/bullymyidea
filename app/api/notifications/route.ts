import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notifications')
    .select('id, type, idea_id, feedback_id, actor_id, metadata, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('notifications fetch error:', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }

  const actorIds = Array.from(new Set((data ?? []).map(n => n.actor_id).filter(Boolean) as string[]))
  const ideaIds = Array.from(new Set((data ?? []).map(n => n.idea_id).filter(Boolean) as string[]))

  const [profilesRes, ideasRes] = await Promise.all([
    actorIds.length ? admin.from('profiles').select('id, username, avatar_url').in('id', actorIds) : { data: [] as any[] },
    ideaIds.length ? admin.from('ideas').select('id, title').in('id', ideaIds) : { data: [] as any[] },
  ])

  const profilesMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]))
  const ideasMap = new Map((ideasRes.data ?? []).map((i: any) => [i.id, i]))

  const hydrated = (data ?? []).map(n => ({
    ...n,
    actor: n.actor_id ? profilesMap.get(n.actor_id) ?? null : null,
    idea: n.idea_id ? ideasMap.get(n.idea_id) ?? null : null,
  }))

  const unreadCount = hydrated.filter(n => !n.read_at).length

  return NextResponse.json({ notifications: hydrated, unread: unreadCount })
}

export async function PATCH() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) {
    console.error('notifications mark-read error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
