'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/components/LanguageProvider'
import { LIMITS, MIN_FORM_DWELL_SECONDS } from '@/lib/limits'
import { toast } from 'sonner'

interface Props { ideaId: string }

type AuthState = 'loading' | 'guest' | 'anon' | 'registered'

export default function FeedbackForm({ ideaId }: Props) {
  const { t } = useLocale()
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const formLoadedAtRef = useRef(Date.now())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user) setAuthState('guest')
      else if (user.is_anonymous) setAuthState('anon')
      else setAuthState('registered')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (website.trim()) return
    const elapsed = (Date.now() - formLoadedAtRef.current) / 1000
    if (elapsed < MIN_FORM_DWELL_SECONDS) {
      setError('Please take a moment before submitting')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea_id: ideaId,
        strengths,
        weaknesses,
        suggestions,
        website,
        form_loaded_at: formLoadedAtRef.current,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to publish')
      toast.error(data.error ?? 'Failed to publish')
      return
    }

    setStrengths(''); setWeaknesses(''); setSuggestions('')
    toast.success('Critique published')
    router.refresh()
  }

  if (authState === 'loading') {
    return (
      <section className="mb-24">
        <div className="bg-[#1a1919] p-8 text-center">
          <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">Checking session…</p>
        </div>
      </section>
    )
  }

  // Sign-in gate — guests and anonymous sessions cannot critique.
  if (authState !== 'registered') {
    return (
      <section className="mb-24">
        <div className="bg-[#1a1919] border-l-4 border-primary p-8 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div>
            <h2 className="font-headline italic font-bold text-2xl text-on-surface mb-2">Want to bully this idea?</h2>
            <p className="font-body text-sm text-on-surface-variant max-w-xl">
              Critique is for registered Inquisitors only. No fake names, no throwaway sessions —
              own your bully.
            </p>
          </div>
          <Link
            href="/auth"
            className="bg-primary text-black font-label font-black uppercase text-xs tracking-[0.25em] px-6 py-3 hover:brightness-110 transition-all no-underline whitespace-nowrap"
          >
            Sign in to critique
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-24">
      <div className="w-full">
        <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-white mb-8 italic">{t('feedback.submitTitle')}</h2>
        <form onSubmit={handleSubmit} className="bg-[#1a1919] p-8 relative space-y-6">
          <div className="grain-overlay absolute inset-0 pointer-events-none"></div>

          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label text-[10px] uppercase tracking-widest text-[#f3ffca] font-bold">{t('feedback.good')}</label>
                <span className="font-label text-[10px] tracking-widest text-neutral-600">{strengths.length}/{LIMITS.feedbackField}</span>
              </div>
              <textarea
                value={strengths} onChange={e => setStrengths(e.target.value)}
                maxLength={LIMITS.feedbackField}
                className="w-full bg-black/30 border border-[#494847]/20 p-4 text-sm font-body text-[#e2e2e2] placeholder:text-neutral-700 focus:border-[#f3ffca] focus:ring-0 min-h-[220px] resize-none outline-none"
                placeholder={t('feedback.goodPlaceholder')}
              ></textarea>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label text-[10px] uppercase tracking-widest text-[#ff7351] font-bold">{t('feedback.bad')}</label>
                <span className="font-label text-[10px] tracking-widest text-neutral-600">{weaknesses.length}/{LIMITS.feedbackField}</span>
              </div>
              <textarea
                value={weaknesses} onChange={e => setWeaknesses(e.target.value)}
                maxLength={LIMITS.feedbackField}
                className="w-full bg-black/30 border border-[#494847]/20 p-4 text-sm font-body text-[#e2e2e2] placeholder:text-neutral-700 focus:border-[#ff7351] focus:ring-0 min-h-[220px] resize-none outline-none"
                placeholder={t('feedback.badPlaceholder')}
              ></textarea>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label text-[10px] uppercase tracking-widest text-orange-400 font-bold">{t('feedback.evolution')}</label>
                <span className="font-label text-[10px] tracking-widest text-neutral-600">{suggestions.length}/{LIMITS.feedbackField}</span>
              </div>
              <textarea
                value={suggestions} onChange={e => setSuggestions(e.target.value)}
                maxLength={LIMITS.feedbackField}
                className="w-full bg-black/30 border border-[#494847]/20 p-4 text-sm font-body text-[#e2e2e2] placeholder:text-neutral-700 focus:border-orange-400 focus:ring-0 min-h-[220px] resize-none outline-none"
                placeholder={t('feedback.evolutionPlaceholder')}
              ></textarea>
            </div>
          </div>

          {error && <p className="text-xs text-[#ff7351] relative z-10" role="alert">{error}</p>}

          <div className="flex justify-end pt-4 border-t border-[#494847]/10 relative z-10">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#f3ffca] text-[#3a4a00] font-label font-bold py-3 px-10 uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all outline-none disabled:opacity-50"
            >
              {loading ? t('feedback.publishing') : t('feedback.publishBtn')}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
