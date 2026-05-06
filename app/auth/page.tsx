'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLocale } from '@/components/LanguageProvider'

type Mode = 'signin' | 'signup' | 'forgot' | 'mfa' | 'awaiting-confirm'

export default function AuthPage() {
  const { t } = useLocale()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  // Email-confirm takeover state
  const [confirmEmail, setConfirmEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Tick down the resend cooldown once per second.
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  async function resendConfirmation() {
    if (!confirmEmail || resendCooldown > 0) return
    const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email: confirmEmail })
    if (resendErr) {
      toast.error(resendErr.message)
      return
    }
    toast.success('Confirmation email re-sent')
    setResendCooldown(60)
  }

  // After password sign-in, check whether the user must complete a 2FA challenge.
  async function maybeRequireMfa(): Promise<boolean> {
    const { data, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalErr || !data) return false
    if (data.nextLevel === 'aal2' && data.currentLevel === 'aal1') {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.find(f => f.status === 'verified')
      if (totp) {
        setMfaFactorId(totp.id)
        setMode('mfa')
        return true
      }
    }
    return false
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault()
    if (!mfaFactorId) return
    setLoading(true)
    setError(null)
    const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
    if (challenge.error || !challenge.data) {
      setLoading(false)
      setError(challenge.error?.message ?? 'Challenge failed')
      return
    }
    const verify = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.data.id,
      code: mfaCode.trim(),
    })
    setLoading(false)
    if (verify.error) {
      setError(verify.error.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'forgot') {
      const redirectTo = `${window.location.origin}/auth/update-password`
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      setLoading(false)
      if (resetErr) {
        setError(resetErr.message)
        return
      }
      toast.success('Reset link sent — check your inbox')
      setMode('signin')
      return
    }

    if (mode === 'signup') {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.is_anonymous) {
        // Anon → registered upgrade. Supabase sends a confirmation email if
        // email confirmation is enabled; the existing session stays usable
        // until the user clicks the link.
        const { error: linkError } = await supabase.auth.updateUser({
          email,
          password,
          data: { username },
        })
        if (linkError) { setError(linkError.message); setLoading(false); return }
        await fetch('/api/auth/setup-profile', { method: 'POST' })
        // Show the takeover so the user knows to confirm email.
        setConfirmEmail(email)
        setMode('awaiting-confirm')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }

      // If email confirmation is required (no session returned), show the
      // "check your inbox" takeover. Otherwise (auto-confirm projects)
      // the user is already signed in — push to home.
      if (!data.session) {
        setConfirmEmail(email)
        setMode('awaiting-confirm')
        setLoading(false)
        return
      }
      await fetch('/api/auth/setup-profile', { method: 'POST' })
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
      // If 2FA is enabled on this account, branch into the challenge.
      const needsMfa = await maybeRequireMfa()
      if (needsMfa) { setLoading(false); return }
    }

    setLoading(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-surface">
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <section className="hidden md:flex md:col-span-7 lg:col-span-8 relative flex-col justify-between p-12 lg:p-20 border-r border-white/5"
        style={{ background: 'linear-gradient(to bottom, #1a1919, #0e0e0e)' }}>

        {/* Grain */}
        <div className="absolute inset-0 grain pointer-events-none z-0" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="font-headline text-3xl italic font-bold text-primary no-underline tracking-tight">
            BullyMyIdea
          </Link>
        </div>

        {/* Manifesto */}
        <div className="relative z-10 max-w-2xl">
          <p className="font-label text-primary uppercase tracking-[0.4em] text-xs mb-6">Manifesto 01</p>
          <h2 className="font-headline font-medium leading-[0.9] text-on-surface mb-8"
            style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
            {t('auth.manifesto')}
          </h2>
          <div className="w-24 bg-primary mb-8" style={{ height: 1 }} />
          <p className="font-body text-on-surface-variant text-lg max-w-md leading-relaxed">
            {t('auth.manifestoDesc')}
          </p>
        </div>

        {/* Footer meta */}
        <div className="relative z-10 flex gap-12 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
          <span>EST. 2026</span>
          <span>BASED IN THE VOID</span>
          <span>© BULLYMYIDEA</span>
        </div>
      </section>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <section className="col-span-1 md:col-span-5 lg:col-span-4 bg-surface flex flex-col justify-center p-8 lg:p-16">
        <div className="max-w-sm w-full mx-auto">

          {/* Mobile logo */}
          <div className="md:hidden mb-12">
            <Link href="/" className="font-headline text-2xl italic font-bold text-primary no-underline">BullyMyIdea</Link>
          </div>

          {/* Mode toggle tabs (signin/signup) — hidden in non-form modes */}
          {mode !== 'forgot' && mode !== 'mfa' && mode !== 'awaiting-confirm' && (
            <div className="flex mb-12 border-b border-white/10">
              <button
                onClick={() => { setMode('signin'); setError(null) }}
                className={`font-headline italic text-xl font-bold pb-4 mr-8 border-b-2 transition-all ${
                  mode === 'signin' ? 'border-primary text-on-surface' : 'border-transparent text-neutral-600 hover:text-neutral-300'
                }`}
              >
                {t('auth.login')}
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null) }}
                className={`font-headline italic text-xl font-bold pb-4 border-b-2 transition-all ${
                  mode === 'signup' ? 'border-primary text-on-surface' : 'border-transparent text-neutral-600 hover:text-neutral-300'
                }`}
              >
                {t('auth.register')}
              </button>
            </div>
          )}

          {/* Email-confirmation takeover — shown after a successful signup */}
          {mode === 'awaiting-confirm' ? (
            <section className="space-y-8">
              <div className="flex flex-col items-start gap-4">
                <span aria-hidden="true" className="material-symbols-outlined text-primary" style={{ fontSize: 56 }}>
                  mark_email_read
                </span>
                <h3 className="font-headline italic font-bold text-on-surface" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  Check your inbox.
                </h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                  We sent a confirmation link to{' '}
                  <span className="text-primary font-bold break-all">{confirmEmail}</span>.
                  Click it to activate your account.
                </p>
              </div>

              <div className="border-t border-white/5 pt-6 space-y-4">
                <p className="font-body text-on-surface-variant text-xs">
                  Didn&apos;t arrive? Check spam first, then resend below.
                </p>
                <button
                  onClick={resendConfirmation}
                  disabled={resendCooldown > 0}
                  className="w-full font-label font-black uppercase tracking-[0.2em] py-4 text-xs border-2 border-primary/40 text-primary hover:bg-primary hover:text-black hover:border-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend confirmation email'}
                </button>
                <button
                  onClick={() => { setMode('signin'); setConfirmEmail(''); setError(null) }}
                  className="w-full font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors"
                >
                  ← Back to sign in
                </button>
              </div>
            </section>
          ) : (
          <>
          {/* Header */}
          <header className="mb-10">
            <h3 className="font-headline text-4xl font-bold mb-2">
              {mode === 'signin' ? t('auth.loginTitle')
                : mode === 'signup' ? t('auth.registerTitle')
                : mode === 'mfa' ? 'Two-factor.'
                : 'Reset password.'}
            </h3>
            <p className="font-body text-on-surface-variant text-sm tracking-wide">
              {mode === 'signin' ? t('auth.loginSubtitle')
                : mode === 'signup' ? t('auth.registerSubtitle')
                : mode === 'mfa' ? 'Enter the 6-digit code from your authenticator app.'
                : 'Enter the email tied to your account. We will send a link to reset the password.'}
            </p>
          </header>

          {/* MFA challenge form — distinct flow */}
          {mode === 'mfa' ? (
            <form onSubmit={verifyMfa} className="space-y-8">
              <div className="group">
                <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-2" htmlFor="mfa">
                  Authenticator code
                </label>
                <input
                  id="mfa"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoFocus
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-4 px-0 text-on-surface text-3xl tracking-[0.5em] font-mono focus:ring-0 focus:outline-none focus:border-primary transition-all"
                  placeholder="000000"
                />
              </div>
              {error && <p className="font-label text-xs text-error uppercase tracking-wide">{error}</p>}
              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="w-full bg-primary text-black font-label font-black uppercase tracking-[0.2em] py-5 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <span>{loading ? '...' : 'Verify & sign in'}</span>
                <span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={async () => { await supabase.auth.signOut(); setMode('signin'); setMfaCode(''); setMfaFactorId(null); setError(null) }}
                className="w-full font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors"
              >
                ← Cancel and sign out
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {mode === 'signup' && (
              <div className="group relative">
                <label
                  className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant group-focus-within:text-primary transition-colors block mb-1"
                  htmlFor="username"
                >
                  {t('auth.username')}
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="brutal_critic"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface focus:ring-0 focus:outline-none focus:border-primary transition-all font-body placeholder-on-surface-variant/30"
                  style={{ borderBottomWidth: 1, borderRadius: 0 }}
                />
              </div>
            )}

            <div className="group relative">
              <label
                className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant group-focus-within:text-primary transition-colors block mb-1"
                htmlFor="email"
              >
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface focus:ring-0 focus:outline-none focus:border-primary transition-all font-body placeholder-on-surface-variant/30"
                style={{ borderBottomWidth: 1, borderRadius: 0 }}
              />
            </div>

            {mode !== 'forgot' && (
              <div className="group relative">
                <div className="flex justify-between items-end mb-1">
                  <label
                    className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant group-focus-within:text-primary transition-colors"
                    htmlFor="password"
                  >
                    {t('auth.password')}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null) }}
                      className="font-label text-[9px] uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors pb-1 bg-transparent border-0 cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface focus:ring-0 focus:outline-none focus:border-primary transition-all font-body placeholder-on-surface-variant/30"
                  style={{ borderBottomWidth: 1, borderRadius: 0 }}
                />
              </div>
            )}

            {error && (
              <p className="font-label text-xs text-error uppercase tracking-wide">{error}</p>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-black font-label font-black uppercase tracking-[0.2em] py-5 transition-all active:scale-[0.98] transform flex items-center justify-center gap-2"
                style={{ borderRadius: 0 }}
              >
                <span>{loading ? '...'
                  : mode === 'signin' ? t('auth.executeLogin')
                  : mode === 'signup' ? t('auth.confirmIdentity')
                  : 'Send reset link'}</span>
                <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
              </button>
            </div>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null) }}
                className="w-full font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors"
              >
                ← Back to sign in
              </button>
            )}
          </form>
          )}

          {/* Switch mode */}
          {mode !== 'forgot' && mode !== 'mfa' && (
            <div className="mt-16 pt-8 border-t border-white/5">
              <p className="font-body text-on-surface-variant text-xs mb-6 text-center">
                {mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
              </p>
              <button
                onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null) }}
                className="w-full group flex items-center justify-center gap-3 py-2 bg-transparent border-none cursor-pointer"
              >
                <span className="font-headline italic text-2xl text-on-surface group-hover:text-primary transition-colors">
                  {mode === 'signin' ? t('auth.requestAccess') : t('auth.switchToLogin')}
                </span>
                <span className="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform" aria-hidden="true">north_east</span>
              </button>
            </div>
          )}

          {/* Legal */}
          <div className="mt-12 flex justify-center gap-6 opacity-30">
            <a href="/terms" className="font-label text-[9px] uppercase tracking-tighter hover:opacity-100 transition-opacity text-on-surface no-underline">{t('footer.rules')}</a>
            <a href="/privacy" className="font-label text-[9px] uppercase tracking-tighter hover:opacity-100 transition-opacity text-on-surface no-underline">{t('footer.privacy')}</a>
          </div>
          </>
          )}
        </div>
      </section>

      {/* Grain overlay */}
      <div className="fixed inset-0 grain pointer-events-none z-[100]" />
    </div>
  )
}
