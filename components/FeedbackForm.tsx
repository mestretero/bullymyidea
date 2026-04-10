'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props { ideaId: string }

export default function FeedbackForm({ ideaId }: Props) {
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea_id: ideaId, strengths, weaknesses, suggestions }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Gönderilemedi')
      return
    }

    setStrengths(''); setWeaknesses(''); setSuggestions('')
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: '100%', background: '#ff3b5c', color: '#fff', border: 'none',
        borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '-.01em',
      }}>
        Bully Et
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#141414', border: '1px solid #1e1e1e',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#555' }}>Geri bildirim yaz</span>
        <button type="button" onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#ff3b5c', fontSize: 12, cursor: 'pointer' }}>
          anonim olarak devam et →
        </button>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle('güçlü')}>Güçlü Yanlar</label>
          <textarea value={strengths} onChange={e => setStrengths(e.target.value)}
            placeholder="Ne işe yarıyor?" style={taStyle} />
        </div>
        <div>
          <label style={labelStyle('zayıf')}>Zayıf Yanlar</label>
          <textarea value={weaknesses} onChange={e => setWeaknesses(e.target.value)}
            placeholder="Nerede çöküyor?" style={taStyle} />
        </div>
        <div>
          <label style={labelStyle('öneri')}>Öneri</label>
          <textarea value={suggestions} onChange={e => setSuggestions(e.target.value)}
            placeholder="Nasıl kurtarırsın?" style={taStyle} />
        </div>
        {error && <p style={{ fontSize: 12, color: '#ff3b5c', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          background: '#ff3b5c', color: '#fff', border: 'none', borderRadius: 8,
          padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          {loading ? '...' : 'Gönder'}
        </button>
      </div>
    </form>
  )
}

function labelStyle(type: 'güçlü' | 'zayıf' | 'öneri'): React.CSSProperties {
  const colors = { güçlü: '#68d391', zayıf: '#ff3b5c', öneri: '#f6ad55' }
  return {
    display: 'block', fontSize: 10, fontWeight: 600,
    letterSpacing: '.06em', textTransform: 'uppercase',
    color: colors[type], marginBottom: 5,
  }
}

const taStyle: React.CSSProperties = {
  width: '100%', background: '#0f0f0f', border: '1px solid #1e1e1e',
  borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#aaa',
  resize: 'none', height: 52, fontFamily: 'inherit', outline: 'none',
}
