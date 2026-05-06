'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import IdeaCard from '@/components/IdeaCard'
import { useLocale } from '@/components/LanguageProvider'
import type { TranslationKey } from '@/lib/i18n'
import type { Idea } from '@/types'
import { estimateBullyScore, formatScore } from '@/lib/bully-score'

interface Props {
  allIdeas: Idea[]
  countMap: Record<string, number>
  sortedCategories: string[]
  categoryIcons: Record<string, string>
  sectorCodes: Record<string, string>
}

export default function CategoriesView({
  allIdeas,
  countMap,
  sortedCategories,
  categoryIcons,
  sectorCodes,
}: Props) {
  const { t } = useLocale()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredIdeas = activeCategory
    ? allIdeas.filter(idea => idea.category === activeCategory)
    : []

  const [trending1, trending2] = sortedCategories

  // Top 3 most bullied ideas
  const topIdeas = [...allIdeas]
    .sort((a, b) => (b.feedback_count ?? 0) - (a.feedback_count ?? 0))
    .slice(0, 3)
    .filter(idea => (idea.feedback_count ?? 0) > 0)

  const catName = (val: string) => t(`catName.${val}` as TranslationKey)
  const catDesc = (val: string) => t(`catDesc.${val}` as TranslationKey)

  return (
    <div className="bg-surface min-h-screen">
      <div className="fixed inset-0 grain pointer-events-none z-[99]" />

      {/* ── SIDEBAR ───────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-24 h-[calc(100vh-6rem)] w-64 bg-surface border-r border-white/5 z-40 overflow-y-auto">
        <div className="p-8 pb-4">
          <div className="font-label font-black text-primary text-xs tracking-widest mb-1">{t('cat.sidebarTitle')}</div>
          <div className="text-white/40 text-[10px] tracking-widest font-medium">{t('cat.sidebarSub')}</div>
        </div>
        <nav className="flex flex-col">
          {/* All */}
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-left flex items-center gap-4 px-8 py-4 font-label font-medium uppercase tracking-tighter transition-all duration-200 border-none cursor-pointer ${
              activeCategory === null
                ? 'bg-primary/10 text-primary'
                : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">grid_view</span>
            {t('filter.all')}
          </button>

          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`text-left flex items-center gap-4 px-8 py-4 font-label font-medium uppercase tracking-tighter transition-all duration-200 border-none cursor-pointer ${
                activeCategory === cat.value
                  ? 'bg-primary/10 text-primary border-l-2 border-l-primary'
                  : 'bg-transparent text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined">{categoryIcons[cat.value]}</span>
              {catName(cat.value)}
              <span className="ml-auto text-[10px] opacity-50">{countMap[cat.value] ?? 0}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MAIN ──────────────────────────────── */}
      <main className="lg:ml-64 pt-32 pb-24 px-8 md:px-16 min-h-screen relative z-10">

        {/* When no category selected — show overview */}
        {!activeCategory && (
          <>
            {/* Hero */}
            <section className="mb-24">
              <h1
                className="font-headline italic font-bold tracking-tighter text-primary leading-none mb-8"
                style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)' }}
              >
                {t('cat.heroTitle').split('\n')[0]}<br />{t('cat.heroTitle').split('\n')[1]}
              </h1>
              <p className="max-w-2xl font-body text-on-surface-variant text-lg leading-relaxed border-l border-primary/30 pl-6">
                {t('cat.heroDesc')}
              </p>
            </section>

            {/* Trending Bento */}
            <section className="mb-24">
              <div className="flex items-baseline gap-4 mb-12 border-b border-white/10 pb-4">
                <h2 className="font-body font-black text-2xl tracking-tighter uppercase">{t('cat.trending')}</h2>
                <span className="text-xs font-medium text-white/40 tracking-widest uppercase">{t('cat.highVol')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
                <button
                  onClick={() => setActiveCategory(trending1)}
                  className="md:col-span-8 h-96 relative overflow-hidden bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group border border-white/5 text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div>
                      <span className="bg-primary text-black px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">{t('cat.hotzone')}</span>
                      <h3 className="font-headline italic text-5xl text-white">{catName(trending1)}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-primary tracking-tighter">{countMap[trending1] ?? 0}</div>
                      <div className="text-[10px] text-white/40 tracking-widest uppercase font-bold">{t('cat.underFire')}</div>
                    </div>
                  </div>
                  <div className="absolute top-8 left-8">
                    <span className="material-symbols-outlined text-primary/30 group-hover:text-primary/60 transition-colors" style={{ fontSize: 80 }}>
                      {categoryIcons[trending1]}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveCategory(trending2)}
                  className="md:col-span-4 h-96 relative overflow-hidden bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group border border-white/5 text-left"
                >
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-8 flex flex-col justify-between">
                    <span className="material-symbols-outlined text-primary text-5xl">{categoryIcons[trending2]}</span>
                    <div>
                      <h3 className="font-headline italic text-4xl text-white mb-2">{catName(trending2)}</h3>
                      <div className="text-[10px] text-white/40 tracking-widest uppercase font-bold">{countMap[trending2] ?? 0} {t('cat.targets')}</div>
                    </div>
                  </div>
                </button>
              </div>
            </section>

            {/* All Sectors Grid */}
            <section className="mb-24">
              <div className="flex items-baseline gap-4 mb-12 border-b border-white/10 pb-4">
                <h2 className="font-body font-black text-2xl tracking-tighter uppercase">{t('cat.allSectors')}</h2>
                <span className="text-xs font-medium text-white/40 tracking-widest uppercase">{t('cat.chooseBattle')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className="aspect-square bg-surface-container hover:bg-primary group transition-all duration-300 flex flex-col justify-between p-8 border border-white/5 cursor-pointer text-left"
                  >
                    <div className="flex justify-between items-start">
                      <span className="material-symbols-outlined text-primary text-4xl group-hover:text-black transition-colors">
                        {categoryIcons[cat.value]}
                      </span>
                      <span className="text-[10px] font-bold tracking-widest text-white/30 group-hover:text-black/50 uppercase font-label">
                        {sectorCodes[cat.value]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-headline italic text-4xl text-white group-hover:text-black mb-4 transition-colors">
                        {catName(cat.value)}
                      </h4>
                      <div className="h-px w-12 bg-primary group-hover:bg-black mb-4 transition-colors" />
                      <p className="text-xs text-white/50 group-hover:text-black/70 font-label font-medium tracking-tight">
                        {catDesc(cat.value)} {countMap[cat.value] ? `${countMap[cat.value]} ${t('cat.ideasShredded')}` : t('cat.noIdeas')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Most Bullied */}
            {topIdeas.length > 0 && (
              <section className="mb-24">
                <div className="bg-surface-container-high p-12 border-l-4 border-primary relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 -mr-32 -mt-32 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-3 h-3 bg-error rounded-full animate-pulse" />
                      <h2 className="font-body font-black text-xl tracking-tighter uppercase">{t('cat.mostBullied')}</h2>
                      <span className="text-xs font-medium text-white/40 tracking-widest uppercase ml-2">{t('cat.mostBulliedSub')}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {topIdeas.map(idea => {
                        const score = formatScore(estimateBullyScore(idea.feedback_count ?? 0))
                        return (
                          <Link href={`/idea/${idea.id}`} key={idea.id} className="no-underline block border-b border-white/10 pb-6 group">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-headline italic text-2xl text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">{idea.title}</h5>
                              <span className="font-headline italic font-black text-2xl text-primary ml-4 shrink-0">{score}</span>
                            </div>
                            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-4">
                              {catName(idea.category)} — {idea.feedback_count ?? 0} {t('cat.critiques')}
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="w-24 h-[2px] bg-surface-container-highest">
                                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (idea.feedback_count ?? 0) * 12)}%` }} />
                              </div>
                              <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors">arrow_forward</span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* When a category is selected — show ideas */}
        {activeCategory && (
          <>
            <section className="mb-16">
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-8 bg-transparent border-none cursor-pointer font-label text-xs uppercase tracking-widest"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                {t('cat.allSectors')}
              </button>

              <div className="flex items-center gap-6 mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 48 }}>
                  {categoryIcons[activeCategory]}
                </span>
                <div>
                  <h1
                    className="font-headline italic font-bold tracking-tighter text-primary leading-none"
                    style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
                  >
                    {catName(activeCategory)}
                  </h1>
                  <p className="font-label text-on-surface-variant text-xs uppercase tracking-widest mt-2">
                    {countMap[activeCategory] ?? 0} {t('cat.ideasShredded')}
                  </p>
                </div>
              </div>

              <p className="max-w-2xl font-body text-on-surface-variant text-lg leading-relaxed border-l border-primary/30 pl-6">
                {catDesc(activeCategory)}
              </p>
            </section>

            {filteredIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredIdeas.map(idea => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <span className="material-symbols-outlined text-neutral-700 mb-6" style={{ fontSize: 64 }}>
                  {categoryIcons[activeCategory]}
                </span>
                <p className="font-headline italic text-2xl text-on-surface mb-2">{t('cat.noIdeas')}</p>
                <Link
                  href="/submit"
                  className="mt-8 bg-primary hover:bg-primary-container text-black font-label font-black uppercase tracking-[0.2em] py-5 px-12 transition-all active:scale-[0.98] no-underline flex items-center gap-3"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  {t('nav.postIdea')}
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
