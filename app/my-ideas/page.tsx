import IdeaCard from '@/components/IdeaCard'
import type { Idea } from '@/types'
import { checkAuth } from '@/lib/check-auth'
import { createServerClient } from '@/lib/supabase/server'

export default async function MyIdeasPage() {
  const user = await checkAuth()

  const supabase = createServerClient()
  const { data: ideas } = await supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const normalized: Idea[] = (ideas ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', marginBottom: 8 }}>
        Fikirlerim
      </h1>
      <p style={{ fontSize: 12, color: '#444', marginBottom: 28 }}>{normalized.length} fikir</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {normalized.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
      </div>
      {!normalized.length && (
        <p style={{ color: '#444', fontSize: 13 }}>Henüz bir fikir paylaşmadın.</p>
      )}
    </div>
  )
}
