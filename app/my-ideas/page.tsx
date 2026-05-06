import IdeaCard from '@/components/IdeaCard'
import ArchivedIdeaCard from '@/components/ArchivedIdeaCard'
import Link from 'next/link'
import type { Idea } from '@/types'
import { checkAuth } from '@/lib/check-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocale } from '@/lib/get-locale'
import { t } from '@/lib/i18n'

export default async function MyIdeasPage() {
  const locale = getLocale()
  const user = await checkAuth()

  const supabase = createAdminClient()
  const { data: rows } = await supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const all: Idea[] = (rows ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))
  const active = all.filter(i => i.status !== 'archived')
  const archived = all.filter(i => i.status === 'archived')

  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-16">
          <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">{t('myIdeas.label', locale)}</span>
          <h1
            className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            {t('myIdeas.title', locale)}
          </h1>
          <p className="font-body text-on-surface-variant text-sm tracking-wide">
            {active.length} active{archived.length > 0 ? ` · ${archived.length} archived` : ''}
          </p>
        </div>

        {/* ── ACTIVE ─────────────────────────────────────── */}
        {active.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {active.map(idea => <IdeaCard key={idea.id} idea={idea} />)}

            {/* Add new card */}
            <Link href="/submit" className="no-underline">
              <div className="bg-surface-container-lowest border-2 border-dashed border-white/5 flex items-center justify-center group cursor-pointer hover:border-primary transition-colors" style={{ minHeight: 280 }}>
                <div className="text-center space-y-4">
                  <span aria-hidden="true" className="material-symbols-outlined text-neutral-700 group-hover:text-primary transition-colors" style={{ fontSize: 40 }}>add_circle</span>
                  <p className="font-label uppercase text-xs tracking-widest text-neutral-600 group-hover:text-neutral-300">{t('myIdeas.addNew', locale)}</p>
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <span aria-hidden="true" className="material-symbols-outlined text-neutral-700 mb-6" style={{ fontSize: 64 }}>lightbulb</span>
            <p className="font-headline italic text-2xl text-on-surface mb-2">{t('myIdeas.empty', locale)}</p>
            <p className="font-body text-on-surface-variant text-sm mb-8">{t('myIdeas.emptySub', locale)}</p>
            <Link
              href="/submit"
              className="bg-primary hover:bg-primary-container text-black font-label font-black uppercase tracking-[0.2em] py-5 px-12 transition-all active:scale-[0.98] transform no-underline flex items-center gap-3"
            >
              <span>{t('myIdeas.submitBtn', locale)}</span>
              <span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* ── ARCHIVED ───────────────────────────────────── */}
        {archived.length > 0 && (
          <section className="mt-24">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/10 flex-wrap">
              <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 22 }}>archive</span>
              <h2 className="font-headline italic font-bold text-2xl text-on-surface">
                Archived <span className="font-label text-xs text-neutral-600 ml-2 align-middle">({archived.length})</span>
              </h2>
              <span className="font-label text-[10px] uppercase tracking-widest text-neutral-600 md:ml-auto">
                Hidden from public · Restore to publish again
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
              {archived.map(idea => <ArchivedIdeaCard key={idea.id} idea={idea} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
