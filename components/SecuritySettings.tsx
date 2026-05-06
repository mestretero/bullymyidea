'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type Factor = { id: string; status: string; factor_type: string; friendly_name?: string | null; created_at?: string }

export default function SecuritySettings() {
  const router = useRouter()
  const supabase = createClient()
  const [factors, setFactors] = useState<Factor[]>([])
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  // Enrollment flow state
  const [enrollStep, setEnrollStep] = useState<'idle' | 'qr' | 'verifying'>('idle')
  const [enrolledFactor, setEnrolledFactor] = useState<{ id: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadFactors() {
    setLoading(true)
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors((data?.totp ?? []) as Factor[])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      const ok = !!user && !user.is_anonymous
      setSignedIn(ok)
      if (!ok) router.push('/auth')
      else loadFactors()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startEnroll() {
    setBusy(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    setBusy(false)
    if (error || !data) {
      toast.error(error?.message ?? 'Failed to start enrollment')
      return
    }
    setEnrolledFactor({
      id: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    })
    setEnrollStep('qr')
  }

  async function verifyEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!enrolledFactor) return
    setBusy(true)
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrolledFactor.id })
    if (challenge.error || !challenge.data) {
      setBusy(false); toast.error(challenge.error?.message ?? 'Challenge failed'); return
    }
    const verify = await supabase.auth.mfa.verify({
      factorId: enrolledFactor.id,
      challengeId: challenge.data.id,
      code: code.trim(),
    })
    setBusy(false)
    if (verify.error) {
      toast.error(verify.error.message)
      return
    }
    toast.success('Two-factor authentication enabled')
    setEnrollStep('idle')
    setEnrolledFactor(null)
    setCode('')
    loadFactors()
  }

  async function cancelEnroll() {
    if (enrolledFactor) {
      await supabase.auth.mfa.unenroll({ factorId: enrolledFactor.id }).catch(() => undefined)
    }
    setEnrollStep('idle')
    setEnrolledFactor(null)
    setCode('')
  }

  async function disable(factorId: string) {
    if (!confirm('Disable two-factor authentication? Your account will rely on the password alone.')) return
    setBusy(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    setBusy(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Two-factor authentication disabled')
    loadFactors()
  }

  const verifiedFactor = factors.find(f => f.status === 'verified')

  if (signedIn === null || loading) {
    return (
      <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
        <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant text-center py-20">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/profile/me"
          className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary no-underline inline-block mb-6"
        >
          ← Back to profile
        </Link>

        <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">Security</span>
        <h1
          className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-12"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
        >
          Two-factor auth.
        </h1>

        {/* ── Status / actions ──────────────────────────────────── */}
        {verifiedFactor && enrollStep === 'idle' ? (
          <section className="bg-surface-container-low border-l-4 border-primary p-6 mb-10">
            <div className="flex items-start gap-4 flex-wrap">
              <span aria-hidden="true" className="material-symbols-outlined text-primary mt-1" style={{ fontSize: 28 }}>
                shield
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-headline italic text-2xl text-on-surface mb-1">Enabled</h2>
                <p className="font-body text-sm text-on-surface-variant">
                  An authenticator app is required to sign in. If you lose your device, contact support.
                </p>
              </div>
              <button
                onClick={() => disable(verifiedFactor.id)}
                disabled={busy}
                className="font-label text-[10px] uppercase tracking-widest text-error hover:underline disabled:opacity-50"
              >
                Disable
              </button>
            </div>
          </section>
        ) : enrollStep === 'idle' ? (
          <section className="space-y-6 mb-10">
            <p className="font-body text-on-surface-variant">
              Add a second layer of protection. After enabling, you&apos;ll need a 6-digit code from your
              authenticator app every time you sign in. Use Google Authenticator, Authy, 1Password, or
              any TOTP-compatible app.
            </p>
            <button
              onClick={startEnroll}
              disabled={busy}
              className="bg-primary text-black font-label font-black uppercase tracking-[0.2em] text-xs px-8 py-4 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {busy ? '...' : 'Enable 2FA'}
            </button>
          </section>
        ) : (
          // QR + verification flow
          <section className="space-y-8 mb-10 bg-surface-container-low p-8 border border-white/5">
            <div>
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-primary block mb-2">Step 1</span>
              <h2 className="font-headline italic text-2xl text-on-surface mb-3">Scan the QR code</h2>
              <p className="font-body text-sm text-on-surface-variant mb-4">
                Open your authenticator app and scan this code. Or paste the secret manually.
              </p>
              {enrolledFactor && (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="bg-white p-3 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={enrolledFactor.qr} alt="2FA QR code" width={180} height={180} />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Manual secret</span>
                    <code className="block font-mono text-sm text-primary break-all bg-black/40 p-3 border border-white/5 select-all">
                      {enrolledFactor.secret}
                    </code>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={verifyEnroll} className="space-y-4">
              <div>
                <span className="font-label text-[10px] uppercase tracking-[0.25em] text-primary block mb-2">Step 2</span>
                <h2 className="font-headline italic text-2xl text-on-surface mb-3">Verify with a code</h2>
                <p className="font-body text-sm text-on-surface-variant mb-4">
                  Enter the 6-digit code your app shows now.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="w-48 bg-transparent border-0 border-b-2 border-outline-variant py-3 px-0 text-on-surface text-2xl tracking-[0.5em] font-mono focus:ring-0 focus:outline-none focus:border-primary transition-all"
                  placeholder="000000"
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="bg-primary text-black font-label font-black uppercase tracking-[0.2em] text-xs px-8 py-3 hover:brightness-110 transition-all disabled:opacity-30"
                >
                  {busy ? '...' : 'Verify & enable'}
                </button>
                <button
                  type="button"
                  onClick={cancelEnroll}
                  className="font-label text-xs uppercase tracking-widest text-neutral-500 hover:text-white px-4 py-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="border-t border-white/5 pt-8">
          <p className="font-body text-xs text-neutral-600">
            Lost access to your authenticator? Contact support — admin can disable 2FA on your account
            after identity verification.
          </p>
        </div>
      </div>
    </div>
  )
}
