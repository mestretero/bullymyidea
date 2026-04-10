import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import IdeaCard from '@/components/IdeaCard'
import type { Idea } from '@/types'

interface Props { params: { id: string } }

// Exported for testing
export function buildProfileQuery(userId: string) {
  const supabase = createServerClient()
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) return notFound()

  const { data: ideas } = await supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('user_id', params.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const normalized: Idea[] = (ideas ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>
          {profile.username ?? 'Kullanıcı'}
        </h1>
        <p style={{ fontSize: 12, color: '#444', marginTop: 4 }}>
          {normalized.length} fikir
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {normalized.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
      </div>
      {!normalized.length && (
        <p style={{ color: '#444', fontSize: 13 }}>Henüz fikir yok.</p>
      )}
    </div>
  )
}
