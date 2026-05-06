'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'bmi-cookie-consent'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true)
    } catch {
      // localStorage may be blocked (private mode, etc.) — just don't show.
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[150] bg-surface-container-high border border-white/10 shadow-2xl"
    >
      <div className="p-5 flex flex-col gap-3">
        <span className="font-label text-[10px] uppercase tracking-[0.25em] text-primary">Cookies</span>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          We use essential cookies to keep you signed in and to limit abuse.
          No tracking, no ads, no data sales. Read the{' '}
          <Link href="/privacy" className="text-primary no-underline hover:underline">
            Privacy Policy
          </Link>.
        </p>
        <div className="flex justify-end">
          <button
            onClick={dismiss}
            className="bg-primary text-black font-label font-bold uppercase text-xs tracking-[0.2em] px-6 py-2.5 hover:brightness-110 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
