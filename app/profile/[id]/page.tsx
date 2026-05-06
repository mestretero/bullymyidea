import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ProfileView from '@/components/ProfileView'
import type { Idea, Feedback } from '@/types'
import { estimateBullyScore } from '@/lib/bully-score'
import { activityScore } from '@/lib/achievements'

interface Props { params: { id: string } }

export default async function ProfilePage({ params }: Props) {
  const authClient = createServerClient()
  const { data: { user: currentUser } } = await authClient.auth.getUser()
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) return notFound()

  const isOwner = currentUser?.id === params.id

  // Public visitors see only active ideas; owner gets archived list too.
  let ideasQuery: any = supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })
  if (!isOwner) ideasQuery = ideasQuery.eq('status', 'active')
  const { data: ideasRaw } = await ideasQuery

  const { data: feedbacksGiven } = await supabase
    .from('feedbacks')
    .select('*, votes(vote_type)')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })

  const allIdeas: Idea[] = (ideasRaw ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: ((idea as any).feedback_count)?.[0]?.count ?? 0,
  }))
  const ideas = allIdeas.filter(i => i.status !== 'archived')
  const archivedIdeas = isOwner ? allIdeas.filter(i => i.status === 'archived') : []

  const ratedIdeas = ideas.filter(idea => (idea.feedback_count ?? 0) > 0)
  const avgBullyScore = ratedIdeas.length
    ? (ratedIdeas.reduce((sum, idea) => sum + estimateBullyScore(idea.feedback_count ?? 0), 0) / ratedIdeas.length).toFixed(1)
    : '—'

  // Achievement stats
  const upvotesReceived = (feedbacksGiven ?? []).reduce((sum: number, fb: any) => {
    const ups = (fb.votes ?? []).filter((v: any) => v.vote_type === 'up').length
    return sum + ups
  }, 0)
  const stats = {
    feedbacks_given: feedbacksGiven?.length ?? 0,
    ideas_posted: ideas.length,
    upvotes_received: upvotesReceived,
  }

  // Real global rank: how many users score higher than this one.
  const myScore = activityScore(stats)
  const [{ data: allFeedbackCounts }, { data: allIdeaCounts }, { data: allUpvotes }] = await Promise.all([
    supabase.from('feedbacks').select('user_id'),
    supabase.from('ideas').select('user_id').eq('status', 'active'),
    supabase.from('votes').select('vote_type, feedback_id, feedbacks(user_id)').eq('vote_type', 'up'),
  ])

  const userScores = new Map<string, { fg: number; ip: number; ur: number }>()
  for (const row of (allFeedbackCounts ?? []) as any[]) {
    if (!row.user_id) continue
    const e = userScores.get(row.user_id) ?? { fg: 0, ip: 0, ur: 0 }
    e.fg++
    userScores.set(row.user_id, e)
  }
  for (const row of (allIdeaCounts ?? []) as any[]) {
    if (!row.user_id) continue
    const e = userScores.get(row.user_id) ?? { fg: 0, ip: 0, ur: 0 }
    e.ip++
    userScores.set(row.user_id, e)
  }
  for (const row of (allUpvotes ?? []) as any[]) {
    const fbOwner = row.feedbacks?.user_id
    if (!fbOwner) continue
    const e = userScores.get(fbOwner) ?? { fg: 0, ip: 0, ur: 0 }
    e.ur++
    userScores.set(fbOwner, e)
  }

  const allScores = Array.from(userScores.values()).map(v => activityScore({
    feedbacks_given: v.fg,
    ideas_posted: v.ip,
    upvotes_received: v.ur,
  }))
  const totalUsers = allScores.length
  const higherCount = allScores.filter(s => s > myScore).length
  const globalRank = myScore > 0 ? higherCount + 1 : totalUsers + 1
  const rankInfo = { rank: globalRank, total: totalUsers, score: myScore }

  return (
    <ProfileView
      profile={profile}
      ideas={ideas}
      archivedIdeas={archivedIdeas}
      feedbacksGiven={(feedbacksGiven ?? []) as Feedback[]}
      avgBullyScore={avgBullyScore}
      isOwner={isOwner}
      stats={stats}
      rankInfo={rankInfo}
    />
  )
}
