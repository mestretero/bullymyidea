'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { VoteType } from '@/types'

interface Props {
  feedbackId: string
  voteCounts?: { up: number; down: number }
  userVote?: VoteType | null
}

export default function VoteButtons({ feedbackId, voteCounts, userVote }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function vote(type: VoteType) {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_id: feedbackId, vote_type: type }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Vote failed')
        return
      }
      router.refresh()
    } catch {
      toast.error('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex bg-black/40 border border-[#494847]/20 rounded-lg overflow-hidden">
      <button
        onClick={() => vote('up')}
        disabled={busy}
        aria-label={`Upvote (${voteCounts?.up ?? 0} so far)`}
        aria-pressed={userVote === 'up'}
        className={`flex items-center gap-2 px-4 py-2 transition-colors border-r border-[#494847]/20 ${userVote === 'up' ? 'bg-[#f3ffca]/20' : 'hover:bg-[#f3ffca]/10'}`}
      >
        <span className="material-symbols-outlined text-sm text-[#f3ffca]" aria-hidden="true">north</span>
        <span className="text-xs font-bold text-[#f3ffca]">{voteCounts?.up ?? 0}</span>
      </button>
      <button
        onClick={() => vote('down')}
        disabled={busy}
        aria-label={`Downvote (${voteCounts?.down ?? 0} so far)`}
        aria-pressed={userVote === 'down'}
        className={`flex items-center gap-2 px-4 py-2 transition-colors ${userVote === 'down' ? 'bg-[#ff7351]/20' : 'hover:bg-[#ff7351]/10'}`}
      >
        <span className="material-symbols-outlined text-sm text-[#ff7351]" aria-hidden="true">south</span>
        <span className="text-xs font-bold text-[#ff7351]">{voteCounts?.down ?? 0}</span>
      </button>
    </div>
  )
}
