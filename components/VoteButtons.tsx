'use client'
import type { VoteType } from '@/types'

interface Props {
  feedbackId: string
  voteCounts?: { up: number; down: number }
  userVote?: VoteType | null
}

export default function VoteButtons({ feedbackId, voteCounts, userVote }: Props) {
  async function vote(type: VoteType) {
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_id: feedbackId, vote_type: type }),
    })
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => vote('up')} style={{
        background: userVote === 'up' ? 'rgba(104,211,145,.15)' : 'none',
        border: '1px solid', borderColor: userVote === 'up' ? '#68d391' : '#2a2a2a',
        borderRadius: 6, padding: '3px 10px', fontSize: 11,
        color: userVote === 'up' ? '#68d391' : '#555', cursor: 'pointer',
      }}>
        ↑ {voteCounts?.up ?? 0}
      </button>
      <button onClick={() => vote('down')} style={{
        background: userVote === 'down' ? 'rgba(255,59,92,.1)' : 'none',
        border: '1px solid', borderColor: userVote === 'down' ? '#ff3b5c' : '#2a2a2a',
        borderRadius: 6, padding: '3px 10px', fontSize: 11,
        color: userVote === 'down' ? '#ff3b5c' : '#555', cursor: 'pointer',
      }}>
        ↓ {voteCounts?.down ?? 0}
      </button>
    </div>
  )
}
