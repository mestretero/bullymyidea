'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

export default function SubmitPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('teknoloji')
  const [tags, setTags] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, tags: tagList }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Bir hata oluştu')
      setLoading(false)
      return
    }

    router.push(`/idea/${data.id}`)
  }

  return (
    <div style={{ maxWidth: 600, margin: '48px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-.02em' }}>
        Fikir Gönder
      </h1>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 32 }}>
        Topluluk seni parçalasın. İyi şanslar.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Başlık</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Fikrin kısa adı..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Açıklama</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Fikrin ne? Problem ne? Nasıl çalışıyor?"
            style={{ ...inputStyle, height: 120, resize: 'vertical' }} />
        </div>
        <div>
          <label style={labelStyle}>Kategori</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Etiketler (virgülle ayır)</label>
          <input value={tags} onChange={e => setTags(e.target.value)}
            placeholder="ai, saas, b2b" style={inputStyle} />
        </div>
        {error && <p style={{ fontSize: 12, color: '#ff3b5c' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          background: '#ff3b5c', color: '#fff', border: 'none', borderRadius: 8,
          padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          {loading ? '...' : 'Paylaş ve Bully\'e Aç'}
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '.06em', textTransform: 'uppercase', color: '#666', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#141414', border: '1px solid #1e1e1e',
  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e0e0e0',
  outline: 'none', fontFamily: 'inherit',
}
