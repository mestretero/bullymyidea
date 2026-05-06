import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'

export async function GET() {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    openReports,
    totalIdeas,
    archivedIdeas,
    totalFeedbacks,
    totalProfiles,
    ideasLast24h,
    feedbacksLast24h,
    profilesLast24h,
    recentReportsRes,
    recentIdeasRes,
  ] = await Promise.all([
    admin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('ideas').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('ideas').select('id', { count: 'exact', head: true }).eq('status', 'archived'),
    admin.from('feedbacks').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('ideas').select('id', { count: 'exact', head: true }).gte('created_at', last24h),
    admin.from('feedbacks').select('id', { count: 'exact', head: true }).gte('created_at', last24h),
    admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', last24h),
    admin
      .from('reports')
      .select('id, idea_id, feedback_id, reason, created_at, reporter_user_id')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('ideas')
      .select('id, title, created_at, user_id')
      .eq('status', 'active')
      .gte('created_at', last7d)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Hydrate recent reports
  const recentReports = recentReportsRes.data ?? []
  const reporterIds = Array.from(new Set(recentReports.map((r: any) => r.reporter_user_id).filter(Boolean) as string[]))
  const ideaIds = Array.from(new Set(recentReports.map((r: any) => r.idea_id).filter(Boolean) as string[]))

  const [reporterRes, ideaRes] = await Promise.all([
    reporterIds.length
      ? admin.from('profiles').select('id, username').in('id', reporterIds)
      : Promise.resolve({ data: [] as any[] }),
    ideaIds.length
      ? admin.from('ideas').select('id, title').in('id', ideaIds)
      : Promise.resolve({ data: [] as any[] }),
  ])
  const reporterMap = new Map((reporterRes.data ?? []).map((p: any) => [p.id, p.username]))
  const ideaMap = new Map((ideaRes.data ?? []).map((i: any) => [i.id, i.title]))

  const hydratedReports = recentReports.map((r: any) => ({
    ...r,
    reporter_username: r.reporter_user_id ? reporterMap.get(r.reporter_user_id) ?? null : null,
    idea_title: r.idea_id ? ideaMap.get(r.idea_id) ?? null : null,
  }))

  // Hydrate recent ideas with author username
  const recentIdeas = recentIdeasRes.data ?? []
  const authorIds = Array.from(new Set(recentIdeas.map((i: any) => i.user_id).filter(Boolean) as string[]))
  const authorRes = authorIds.length
    ? await admin.from('profiles').select('id, username').in('id', authorIds)
    : { data: [] as any[] }
  const authorMap = new Map((authorRes.data ?? []).map((p: any) => [p.id, p.username]))
  const hydratedIdeas = recentIdeas.map((i: any) => ({
    ...i,
    author_username: i.user_id ? authorMap.get(i.user_id) ?? null : null,
  }))

  return NextResponse.json({
    counts: {
      open_reports: openReports.count ?? 0,
      total_ideas: totalIdeas.count ?? 0,
      archived_ideas: archivedIdeas.count ?? 0,
      total_feedbacks: totalFeedbacks.count ?? 0,
      total_profiles: totalProfiles.count ?? 0,
      ideas_24h: ideasLast24h.count ?? 0,
      feedbacks_24h: feedbacksLast24h.count ?? 0,
      profiles_24h: profilesLast24h.count ?? 0,
    },
    recent_reports: hydratedReports,
    recent_ideas: hydratedIdeas,
  })
}
