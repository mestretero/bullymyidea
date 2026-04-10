import type { Feedback } from '@/types'
import VoteButtons from './VoteButtons'
import ReportButton from './ReportButton'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Props { feedback: Feedback }

export default function FeedbackCard({ feedback }: Props) {
  const timeAgo = formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: tr })

  return (
    <div style={{
      background: '#141414', border: '1px solid #1e1e1e',
      borderRadius: 12, padding: 16, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#444' }}>
          {feedback.user_id ? `@kullanıcı` : 'anonim'} · {timeAgo}
        </span>
        <ReportButton feedbackId={feedback.id} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#68d391', marginBottom: 5 }}>
            Güçlü
          </div>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{feedback.strengths || '—'}</p>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#ff3b5c', marginBottom: 5 }}>
            Zayıf
          </div>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{feedback.weaknesses || '—'}</p>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#f6ad55', marginBottom: 5 }}>
            Öneri
          </div>
          <p style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>{feedback.suggestions || '—'}</p>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <VoteButtons feedbackId={feedback.id} voteCounts={feedback.vote_counts} userVote={feedback.user_vote} />
      </div>
    </div>
  )
}
