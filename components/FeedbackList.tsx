'use client'
import { useEffect, useState } from 'react'
import type { Feedback } from '@/types'
import FeedbackCard from './FeedbackCard'
import { useLocale } from '@/components/LanguageProvider'

interface Props {
  feedbacks: Feedback[]
  ideaId: string
  hasMore: boolean
  currentUserId?: string | null
}

export default function FeedbackList({ feedbacks: initial, ideaId, hasMore: initialHasMore, currentUserId }: Props) {
  const { t } = useLocale()
  // Local-only state for paginated extras; server-fetched `initial` stays the source of truth.
  const [extra, setExtra] = useState<Feedback[]>([])
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<'recent' | 'top'>('recent')

  // When server refetches (router.refresh after edit/delete), `initial` changes
  // — clear stale `extra` so deleted feedbacks don't ghost.
  const initialKey = initial.map(f => f.id).join(',')
  useEffect(() => {
    setExtra([])
    setHasMore(initialHasMore)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey, initialHasMore])

  const feedbacks = [...initial, ...extra]

  async function loadMore() {
    setLoading(true)
    const cursor = feedbacks[feedbacks.length - 1]?.created_at
    const res = await fetch(`/api/feedbacks?idea_id=${ideaId}&cursor=${cursor}`)
    const data = await res.json()
    setExtra(prev => [...prev, ...(data.feedbacks ?? [])])
    setHasMore(data.has_more)
    setLoading(false)
  }

  const sorted = sort === 'top'
    ? [...feedbacks].sort((a, b) => {
        const sa = (a.vote_counts?.up ?? 0) - (a.vote_counts?.down ?? 0)
        const sb = (b.vote_counts?.up ?? 0) - (b.vote_counts?.down ?? 0)
        return sb - sa
      })
    : feedbacks

  return (
    <>
      <div className="flex items-center justify-between mb-10">
        <h2 className="font-headline text-5xl font-black italic tracking-tighter">{t('feedback.title')}</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setSort('recent')}
            className={`text-[10px] uppercase tracking-widest font-bold pb-1 transition-colors ${sort === 'recent' ? 'text-[#f3ffca] border-b border-[#f3ffca]' : 'text-neutral-500 hover:text-white'}`}
          >{t('feedback.recent')}</button>
          <button
            onClick={() => setSort('top')}
            className={`text-[10px] uppercase tracking-widest font-bold pb-1 transition-colors ${sort === 'top' ? 'text-[#f3ffca] border-b border-[#f3ffca]' : 'text-neutral-500 hover:text-white'}`}
          >{t('feedback.topVoted')}</button>
        </div>
      </div>

      <div className="w-full space-y-8">
        {!feedbacks.length ? (
          <p className="text-neutral-500 text-sm font-label italic py-10 text-center">{t('feedback.noBullies')}</p>
        ) : (
          sorted.map(fb => <FeedbackCard key={fb.id} feedback={fb} isOwner={currentUserId != null && fb.user_id === currentUserId} />)
        )}

        {hasMore && (
          <div className="pt-8 flex justify-center">
            <button 
              onClick={loadMore} 
              disabled={loading}
              className="w-full md:w-auto px-16 py-6 border-2 border-white/10 hover:border-[#f3ffca] hover:text-[#f3ffca] transition-all font-label font-black text-xs uppercase tracking-[0.4em] bg-black/40 backdrop-blur-sm outline-none disabled:opacity-50"
            >
              {loading ? t('feedback.loading') : t('feedback.loadMore')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
