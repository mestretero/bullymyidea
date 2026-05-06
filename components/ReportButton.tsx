'use client'
import { toast } from 'sonner'

interface Props {
  ideaId?: string
  feedbackId?: string
}

export default function ReportButton({ ideaId, feedbackId }: Props) {
  async function report() {
    const reason = prompt('Why are you reporting this? (optional)')
    if (reason === null) return
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, feedback_id: feedbackId, reason }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Report failed')
      return
    }
    toast.success('Reported. Thanks for keeping it clean.')
  }

  return (
    <button
      onClick={report}
      aria-label="Report this content"
      className="text-[10px] uppercase tracking-widest text-neutral-600 hover:text-[#ff7351] transition-colors font-bold"
    >
      Report
    </button>
  )
}
