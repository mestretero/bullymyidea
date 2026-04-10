'use client'

interface Props {
  ideaId?: string
  feedbackId?: string
}

export default function ReportButton({ ideaId, feedbackId }: Props) {
  async function report() {
    const reason = prompt('Şikayet sebebi:')
    if (!reason) return
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, feedback_id: feedbackId, reason }),
    })
    alert('Şikayetin alındı.')
  }

  return (
    <button onClick={report} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 10, color: '#2a2a2a',
    }}>
      Şikayet Et
    </button>
  )
}
