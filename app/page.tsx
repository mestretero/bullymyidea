import { createServerClient } from '@/lib/supabase/server'
import IdeaCard from '@/components/IdeaCard'
import CategoryFilter from '@/components/CategoryFilter'
import type { Idea } from '@/types'
import type { Category } from '@/types'
import { Suspense } from 'react'

// Exported for testing
export function buildIdeasQuery(category: string | undefined) {
  const supabase = createServerClient()
  let query = supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)

  if (category) {
    query = (query as any).eq('category', category as Category)
  }

  return query
}

async function IdeaFeed({ category }: { category: string | undefined }) {
  const { data: ideas, error } = await buildIdeasQuery(category)

  if (error) return <p style={{ color: '#555', padding: '40px 0' }}>Fikirler yüklenemedi.</p>
  if (!ideas?.length) return <p style={{ color: '#555', padding: '40px 0' }}>Henüz fikir yok.</p>

  const normalized: Idea[] = (ideas as any[]).map((idea) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {normalized.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
    </div>
  )
}

interface Props {
  searchParams: { category?: string }
}

export default function HomePage({ searchParams }: Props) {
  return (
    <div style={{ paddingTop: 32 }}>
      <Suspense>
        <CategoryFilter />
      </Suspense>
      <Suspense fallback={<p style={{ color: '#555' }}>Yükleniyor...</p>}>
        <IdeaFeed category={searchParams.category} />
      </Suspense>
    </div>
  )
}
