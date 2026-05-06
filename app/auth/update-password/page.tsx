'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Supabase reset-password flow lands here. The recovery link in the email
// contains tokens that Supabase auto-applies via detectSessionInUrl. We just
// need the user to type a new password and call updateUser.

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // We only allow this page to act when we have a recovery session.
    // onAuthStateChange fires PASSWORD_RECOVERY when Supabase parses the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    // Also check if we already have a session (page refresh after click).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    toast.success('Password updated. You are signed in.')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <Link href="/" className="font-headline text-2xl italic font-bold text-primary no-underline block mb-12">
          BullyMyIdea
        </Link>

        <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">Reset</span>
        <h1
          className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-4"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
        >
          New password.
        </h1>
        <p className="font-body text-on-surface-variant text-sm mb-12">
          Pick a new password — at least 8 characters. After confirmation you&apos;ll be signed in automatically.
        </p>

        {!ready ? (
          <div className="bg-surface-container-low border-l-4 border-error p-6">
            <p className="font-headline italic text-xl text-error mb-2">Invalid or expired link</p>
            <p className="font-body text-sm text-on-surface-variant mb-6">
              The recovery link is invalid or has expired. Request a new one from the sign-in page.
            </p>
            <Link
              href="/auth"
              className="bg-primary text-black font-label font-black uppercase tracking-[0.2em] text-xs px-6 py-3 hover:brightness-110 transition-all no-underline inline-block"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="group">
              <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-2" htmlFor="pw">
                New password
              </label>
              <input
                id="pw"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface focus:ring-0 focus:outline-none focus:border-primary transition-all font-body"
                style={{ borderBottomWidth: 1, borderRadius: 0 }}
              />
            </div>
            <div className="group">
              <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-2" htmlFor="pw2">
                Confirm password
              </label>
              <input
                id="pw2"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface focus:ring-0 focus:outline-none focus:border-primary transition-all font-body"
                style={{ borderBottomWidth: 1, borderRadius: 0 }}
              />
            </div>

            {error && <p className="font-label text-xs text-error uppercase tracking-wide">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-label font-black uppercase tracking-[0.2em] py-5 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? '...' : 'Update password'}</span>
              <span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
