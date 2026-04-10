import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getCategoryMeta } from '@/lib/categories'
import FeedbackList from '@/components/FeedbackList'
import FeedbackForm from '@/components/FeedbackForm'
import ReportButton from '@/components/ReportButton'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Feedback } from '@/types'

const PAGE_SIZE = 10

interface Props { params: { id: string } }

export default async function IdeaDetailPage({ params }: Props) {
  const supabase = createServerClient()

  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !idea) return notFound()
  if (idea.status === 'archived') {
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 16px', textAlign: 'center', color: '#444' }}>
        Bu fikir kaldırıldı.
      </div>
    )
  }

  const { data: feedbacksRaw } = await supabase
    .from('feedbacks')
    .select('*, votes(vote_type)')
    .eq('idea_id', params.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  const feedbacks: Feedback[] = (feedbacksRaw ?? []).map((fb: any) => {
    const votes: { vote_type: string }[] = fb.votes ?? []
    return {
      ...fb,
      votes: undefined,
      vote_counts: {
        up: votes.filter(v => v.vote_type === 'up').length,
        down: votes.filter(v => v.vote_type === 'down').length,
      },
    }
  })
  const hasMore = feedbacks.length > PAGE_SIZE
  const page = hasMore ? feedbacks.slice(0, PAGE_SIZE) : feedbacks

  const cat = getCategoryMeta(idea.category)
  const timeAgo = formatDistanceToNow(new Date(idea.created_at), { addSuffix: true, locale: tr })

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 100,
            background: cat.bg, color: cat.color, fontWeight: 500,
          }}>{cat.label}</span>
          {idea.tags.map((t: string) => (
            <span key={t} style={{ fontSize: 11, color: '#333' }}>#{t}</span>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: '-.02em', lineHeight: 1.3 }}>
          {idea.title}
        </h1>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.7, margin: '0 0 12px' }}>
          {idea.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#333' }}>
            {idea.user_id ? 'kayıtlı kullanıcı' : 'anonim'} · {timeAgo}
          </span>
          <ReportButton ideaId={idea.id} />
        </div>
      </div>

      <div style={{ height: 1, background: '#161616', margin: '24px 0' }} />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#ccc', margin: 0 }}>
            {page.length} Geri Bildirim
          </h2>
        </div>

        <FeedbackForm ideaId={params.id} />

        <div style={{ marginTop: 20 }}>
          <FeedbackList feedbacks={page} ideaId={params.id} hasMore={hasMore} />
        </div>
      </div>
    </div>
  )
}
