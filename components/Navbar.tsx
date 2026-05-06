'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/components/LanguageProvider'
import NotificationBell from '@/components/NotificationBell'
import type { Session } from '@supabase/supabase-js'

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLocale()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const isRegistered = session?.user?.is_anonymous === false

  if (pathname === '/auth') return null

  const navLinks = isRegistered
    ? [
        { label: t('nav.feed'), href: '/' },
        { label: t('nav.categories'), href: '/categories' },
        { label: t('nav.myIdeas'), href: '/my-ideas' },
        { label: 'Saved', href: '/bookmarks' },
      ]
    : [
        { label: t('nav.feed'), href: '/' },
        { label: t('nav.categories'), href: '/categories' },
        { label: t('nav.myIdeas'), href: '/my-ideas' },
      ]

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between px-4 md:px-10 py-5 bg-black/70 backdrop-blur-2xl bg-gradient-to-b from-[#1a1919] to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Logo */}
        <Link href="/" className="font-headline text-xl md:text-3xl italic font-bold text-primary no-underline whitespace-nowrap">
          BullyMyIdea
        </Link>

        {/* Nav links — center (desktop) */}
        <nav className="hidden md:flex items-center gap-8 font-label tracking-tight">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`font-medium uppercase text-xs tracking-widest no-underline transition-colors ${
                pathname === href ? 'text-primary border-b border-primary pb-1' : 'text-neutral-500 hover:text-neutral-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Random idea — roulette */}
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/ideas/random')
                const data = await res.json().catch(() => ({}))
                if (res.ok && data.id) {
                  router.push(`/idea/${data.id}`)
                  return
                }
                if (res.status === 404) {
                  toast.error('No ideas yet — be the first.')
                  return
                }
                toast.error(data.error ?? 'Failed to roll')
              } catch {
                toast.error('Network error')
              }
            }}
            aria-label="Random idea"
            title="Random idea"
            className="hidden sm:flex w-9 h-9 items-center justify-center text-white/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>casino</span>
          </button>

          {/* Search */}
          <Link
            href="/search"
            aria-label="Search"
            className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-primary hover:bg-primary/5 transition-all no-underline"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
          </Link>

          <NotificationBell enabled={isRegistered} />

          {/* Profile / Auth */}
          <Link
            href={isRegistered ? '/profile/me' : '/auth'}
            aria-label={isRegistered ? 'My profile' : 'Sign in'}
            className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-primary hover:bg-primary/5 transition-all no-underline"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20 }}>account_circle</span>
          </Link>

          {/* Logout — registered only, desktop only */}
          {isRegistered && (
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              className="hidden md:flex w-9 h-9 items-center justify-center text-white/40 hover:text-[#ff7351] hover:bg-[#ff7351]/5 transition-all"
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20 }}>logout</span>
            </button>
          )}

          {/* Divider + CTA (desktop) */}
          <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />
          <Link
            href="/submit"
            className="hidden md:flex bg-primary text-black font-label font-bold py-2.5 px-6 uppercase text-[10px] tracking-widest active:scale-95 transform transition-all hover:bg-primary-container no-underline items-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
            {t('nav.postIdea')}
          </Link>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-white/60 hover:text-primary transition-all"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 22 }}>
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[69px] z-[99] bg-[#0e0e0e]/97 backdrop-blur-xl flex flex-col px-8 pt-12 pb-8 gap-0">
          <nav className="flex flex-col gap-1 mb-10">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`font-headline italic text-4xl font-bold py-4 no-underline border-b border-white/5 transition-colors ${
                  pathname === href ? 'text-primary' : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/submit"
              className="font-headline italic text-4xl font-bold py-4 no-underline border-b border-white/5 text-white/60 hover:text-white transition-colors"
            >
              {t('nav.postIdea')}
            </Link>
          </nav>

          <div className="mt-auto flex flex-col gap-4">
            {isRegistered ? (
              <button
                onClick={handleLogout}
                className="w-full bg-[#ff7351]/10 border border-[#ff7351]/30 text-[#ff7351] font-label font-bold py-4 uppercase text-xs tracking-widest"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth"
                className="w-full bg-primary text-black font-label font-bold py-4 uppercase text-xs tracking-widest text-center no-underline"
              >
                {t('auth.login')}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
