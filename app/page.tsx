import HomeFeed from '@/components/HomeFeed'
import type { Idea } from '@/types'
import { buildIdeasQuery } from '@/lib/build-ideas-query'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { getLocale } from '@/lib/get-locale'
import { t } from '@/lib/i18n'

async function getHomepageStats() {
  const admin = createAdminClient()
  const [{ count: ideaCount }, { count: feedbackCount }] = await Promise.all([
    admin.from('ideas').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('feedbacks').select('id', { count: 'exact', head: true }),
  ])
  return {
    ideaCount: ideaCount ?? 0,
    feedbackCount: feedbackCount ?? 0,
  }
}

async function getInitialIdeas(category: string | undefined) {
  const { data } = await buildIdeasQuery(category)
  const all: Idea[] = (data ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))
  const hasMore = all.length > 20
  const ideas = hasMore ? all.slice(0, 20) : all
  const cursor = ideas[ideas.length - 1]?.created_at
  return { ideas, hasMore, cursor }
}

interface Props {
  searchParams: { category?: string }
}

export default async function HomePage({ searchParams }: Props) {
  const locale = getLocale()
  const { ideaCount, feedbackCount } = await getHomepageStats()
  const { ideas, hasMore, cursor } = await getInitialIdeas(searchParams.category)
  return (
    <div className="bg-surface">

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center px-5 md:px-10 pt-36 pb-24 overflow-hidden"
        style={{
          backgroundImage: "url('/hero-bg-4.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0e0e0e]/85 pointer-events-none" />

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0e0e0e)' }}
        />

        {/* Grain overlay */}
        <div className="fixed inset-0 grain z-[100] pointer-events-none" />

        {/* Background accent glow */}
        <div
          className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(202,253,0,0.04) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-12 gap-6 relative z-10">

          {/* Headline — spans 9 cols on desktop */}
          <div className="col-span-12 md:col-span-9">
            <h1 className="hero-title">
              {t('home.heroTitle', locale).split('\n')[0]}<br />
              <span className="italic text-primary">{t('home.heroTitle', locale).split('\n')[1]}</span><br />
              {t('home.heroTitle', locale).split('\n')[2]}
            </h1>
          </div>

          {/* Manifest box — floats right, overlaps headline */}
          <div className="col-span-12 md:col-span-5 md:col-start-7 md:-mt-32 z-20">
            <div
              className="bg-surface-container p-8"
              style={{ borderLeft: '4px solid var(--primary)' }}
            >
              <p className="font-headline italic text-2xl leading-snug mb-6 text-on-surface">
                {t('home.manifest', locale)}
              </p>
              <Link
                href="/submit"
                className="btn-primary w-full py-5 bg-primary-container text-black font-label font-black uppercase tracking-[0.18em] text-sm flex items-center justify-center gap-3 no-underline"
              >
                {t('home.cta', locale)}
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="col-span-12 flex flex-wrap gap-x-8 gap-y-6 md:gap-12 mt-8 md:mt-0">
            {[
              { num: ideaCount.toLocaleString('en'), label: t('home.statIdeas', locale) },
              { num: feedbackCount.toLocaleString('en'), label: t('home.statFeedback', locale) },
              { num: '94%', label: t('home.statReturn', locale) },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="font-headline italic font-black text-primary" style={{ fontSize: '2rem' }}>{num}</div>
                <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY FILTER + IDEA FEED (client) ───────── */}
      <HomeFeed
        initialIdeas={ideas}
        initialHasMore={hasMore}
        initialCursor={cursor}
        initialCategory={searchParams.category}
      />

      {/* ── MANIFESTO ─────────────────────────────────── */}
      <section className="py-40 px-8 md:px-10 relative overflow-hidden bg-surface-container-lowest">

        {/* Ghost text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <span
            className="font-headline font-black uppercase text-stroke select-none"
            style={{ fontSize: 'clamp(8rem, 30vw, 22rem)', opacity: 0.08, whiteSpace: 'nowrap' }}
          >
            BULLY
          </span>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2
            className="font-headline font-black uppercase leading-tight mb-12"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}
          >
            {t('home.manifestoTitle', locale).split('\n')[0]}<br />
            <span className="italic text-primary">{t('home.manifestoTitle', locale).split('\n')[1]}</span>
          </h2>
          <p className="font-body text-xl text-on-surface-variant mb-16 max-w-2xl mx-auto leading-relaxed">
            {t('home.manifestoDesc', locale)}
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-5">
            <Link
              href="/submit"
              className="btn-primary bg-primary text-black font-label font-black uppercase tracking-[0.25em] text-sm px-16 py-6 no-underline inline-block"
            >
              {t('home.submitIdea', locale)}
            </Link>
            <Link
              href="/auth"
              className="font-label font-black uppercase tracking-[0.25em] text-sm px-16 py-6 no-underline inline-block transition-all text-primary hover:bg-primary hover:text-black"
              style={{ border: '1px solid var(--primary)' }}
            >
              {t('home.beInquisitor', locale)}
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
