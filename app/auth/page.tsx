'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signup') {
      // Check if we have an anonymous session to upgrade
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.is_anonymous) {
        // Link email identity to anonymous account — preserves all content
        const { error: linkError } = await supabase.auth.updateUser({ email, password })
        if (linkError) { setError(linkError.message); setLoading(false); return }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) { setError(signUpError.message); setLoading(false); return }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
    }

    setLoading(false)
    router.push('/')
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-.02em' }}>
        {mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
      </h1>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 32 }}>
        {mode === 'signup' ? 'Anonim yorumların profiline bağlanacak.' : ''}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)}
          required style={inputStyle}
        />
        <input
          type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)}
          required style={inputStyle}
        />
        {error && <p style={{ fontSize: 12, color: '#ff3b5c' }}>{error}</p>}
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? '...' : mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>
      </form>

      <button
        onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
        style={{ marginTop: 16, fontSize: 12, color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {mode === 'signin' ? 'Hesabın yok mu? Kayıt ol →' : 'Zaten hesabın var mı? Giriş yap →'}
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#141414', border: '1px solid #1e1e1e', borderRadius: 8,
  padding: '10px 14px', fontSize: 13, color: '#e0e0e0', outline: 'none',
}
const btnStyle: React.CSSProperties = {
  background: '#ff3b5c', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
