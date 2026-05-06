import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'

export async function GET(request: Request) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') === 'resolved' ? 'resolved' : 'open'

  const admin = createAdminClient()
  const { data: reports, error } = await admin
    .from('reports')
    .select('id, idea_id, feedback_id, reason, status, created_at, resolved_at, resolved_by, admin_note, reporter_user_id')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('admin reports fetch:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  // Hydrate target context (idea / feedback) + reporter username.
  const ideaIds = Array.from(new Set((reports ?? []).map(r => r.idea_id).filter(Boolean) as string[]))
  const feedbackIds = Array.from(new Set((reports ?? []).map(r => r.feedback_id).filter(Boolean) as string[]))
  const userIds = Array.from(new Set((reports ?? [])
    .flatMap(r => [r.reporter_user_id, r.resolved_by])
    .filter(Boolean) as string[]))

  const [ideasRes, fbRes, profsRes] = await Promise.all([
    ideaIds.length
      ? admin.from('ideas').select('id, title, status, user_id').in('id', ideaIds)
      : Promise.resolve({ data: [] as any[] }),
    feedbackIds.length
      ? admin.from('feedbacks').select('id, idea_id, user_id, strengths, weaknesses, suggestions').in('id', feedbackIds)
      : Promise.resolve({ data: [] as any[] }),
    userIds.length
      ? admin.from('profiles').select('id, username').in('id', userIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const ideaMap = new Map((ideasRes.data ?? []).map((i: any) => [i.id, i]))
  const fbMap = new Map((fbRes.data ?? []).map((f: any) => [f.id, f]))
  const profMap = new Map((profsRes.data ?? []).map((p: any) => [p.id, p.username]))

  const hydrated = (reports ?? []).map(r => ({
    ...r,
    idea: r.idea_id ? ideaMap.get(r.idea_id) ?? null : null,
    feedback: r.feedback_id ? fbMap.get(r.feedback_id) ?? null : null,
    reporter_username: r.reporter_user_id ? profMap.get(r.reporter_user_id) ?? null : null,
    resolver_username: r.resolved_by ? profMap.get(r.resolved_by) ?? null : null,
  }))

  return NextResponse.json({ reports: hydrated })
}
