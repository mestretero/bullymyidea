'use client'
import { useState } from 'react'
import type { Feedback } from '@/types'
import FeedbackCard from './FeedbackCard'

interface Props {
  feedbacks: Feedback[]
  ideaId: string
  hasMore: boolean
}

export default function FeedbackList({ feedbacks: initial, ideaId, hasMore: initialHasMore }: Props) {
  const [feedbacks, setFeedbacks] = useState(initial)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  async function loadMore() {
    setLoading(true)
    const cursor = feedbacks[feedbacks.length - 1]?.created_at
    const res = await fetch(`/api/feedbacks?idea_id=${ideaId}&cursor=${cursor}`)
    const data = await res.json()
    setFeedbacks(prev => [...prev, ...data.feedbacks])
    setHasMore(data.has_more)
    setLoading(false)
  }

  if (!feedbacks.length) {
    return <p style={{ color: '#444', fontSize: 13, padding: '24px 0' }}>Henüz bully yok. İlk sen ol.</p>
  }

  return (
    <div>
      {feedbacks.map(fb => <FeedbackCard key={fb.id} feedback={fb} />)}
      {hasMore && (
        <button onClick={loadMore} disabled={loading} style={{
          background: 'none', border: '1px solid #1e1e1e', borderRadius: 8,
          padding: '10px 20px', color: '#555', fontSize: 12, cursor: 'pointer', width: '100%', marginTop: 8,
        }}>
          {loading ? '...' : 'Daha fazla yükle'}
        </button>
      )}
    </div>
  )
}
