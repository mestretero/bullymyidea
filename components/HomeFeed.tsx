'use client'
import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import IdeaCard from '@/components/IdeaCard'
import { CATEGORIES } from '@/lib/categories'
import { useLocale } from '@/components/LanguageProvider'
import type { TranslationKey } from '@/lib/i18n'
import type { Idea } from '@/types'

interface Props {
  initialIdeas: Idea[]
  initialHasMore: boolean
  initialCursor: string | undefined
  initialCategory: string | undefined
}

export default function HomeFeed({ initialIdeas, initialHasMore, initialCursor, initialCategory }: Props) {
  const { t } = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  type SortMode = 'newest' | 'trending' | 'controversial'

  const [category, setCategory] = useState<string | undefined>(initialCategory)
  const [sort, setSort] = useState<SortMode>('newest')
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  // 'newest' uses created_at cursor; 'trending' and 'controversial' use offset
  // (in-app score, date-cursor would gap/duplicate).
  const [cursor, setCursor] = useState<string | undefined>(initialCursor)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchIdeas(
    cat: string | undefined,
    s: SortMode,
    pageState: { cursor?: string; offset?: number },
    append: boolean,
  ) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (cat) params.set('category', cat)
      if (s !== 'newest') {
        params.set('sort', s)
        if (pageState.offset) params.set('offset', String(pageState.offset))
      } else if (pageState.cursor) {
        params.set('cursor', pageState.cursor)
      }
      const res = await fetch(`/api/ideas?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      const newIdeas: Idea[] = (data.ideas ?? []).map((idea: any) => ({
        ...idea,
        feedback_count: idea.feedback_count ?? 0,
      }))
      setIdeas(prev => append ? [...prev, ...newIdeas] : newIdeas)
      if (s !== 'newest') {
        setOffset(typeof data.next_offset === 'number' ? data.next_offset : 0)
        setCursor(undefined)
      } else {
        setCursor(newIdeas[newIdeas.length - 1]?.created_at)
        setOffset(0)
      }
      setHasMore(data.has_more)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function selectCategory(value: string) {
    const newCat = value === 'all' ? undefined : value
    setCategory(newCat)
    const params = new URLSearchParams(searchParams.toString())
    if (newCat) params.set('category', newCat)
    else params.delete('category')
    startTransition(() => {
      router.replace(`/${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
    })
    fetchIdeas(newCat, sort, {}, false)
  }

  function selectSort(value: SortMode) {
    if (value === sort) return
    setSort(value)
    fetchIdeas(category, value, {}, false)
  }

  function loadMore() {
    if (loading) return
    if (sort !== 'newest') {
      if (!hasMore) return
      fetchIdeas(category, sort, { offset }, true)
    } else {
      if (!cursor) return
      fetchIdeas(category, sort, { cursor }, true)
    }
  }

  const filterButtons = [
    { value: 'all', label: t('filter.all') },
    ...CATEGORIES.map(c => ({ value: c.value, label: t(`catName.${c.value}` as TranslationKey) }))
  ]
  const active = category ?? 'all'

  return (
    <>
      {/* Category filter */}
      <section
        className="bg-surface-container-low py-7 px-8 md:px-10"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col gap-4">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{t('filter.select')}</span>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map(cat => {
              const isActive = active === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => selectCategory(cat.value)}
                  disabled={loading && isActive}
                  className="font-label text-[11px] uppercase tracking-widest font-bold px-5 py-2 transition-colors duration-150 disabled:opacity-60"
                  style={{
                    background: isActive ? 'var(--primary)' : 'var(--surface-highest)',
                    color: isActive ? '#000' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    border: 'none',
                    letterSpacing: '0.12em',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Idea feed */}
      <section className="py-16 px-8 md:px-10 bg-surface">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
            <h2 className="font-label text-[11px] uppercase tracking-[0.25em] text-on-surface-variant">
              {sort === 'trending' ? 'Trending now' : sort === 'controversial' ? 'Most controversial' : t('home.recentIdeas')}
            </h2>
            <div className="flex gap-4 flex-wrap">
              {([
                { id: 'newest', label: 'Newest' },
                { id: 'trending', label: 'Trending' },
                { id: 'controversial', label: 'Controversial' },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => selectSort(opt.id)}
                  aria-pressed={sort === opt.id}
                  className={`font-label text-[10px] uppercase tracking-widest font-bold pb-1 transition-colors ${sort === opt.id ? 'text-primary border-b border-primary' : 'text-neutral-500 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="font-label text-on-surface-variant text-xs uppercase tracking-widest py-20 text-center">
              {t('home.loadFailed')}
            </p>
          )}

          {!error && ideas.length === 0 && !loading && (
            <p className="font-label text-on-surface-variant text-xs uppercase tracking-widest py-20 text-center">
              {t('home.noIdeas')}
            </p>
          )}

          {ideas.length > 0 && (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
              {ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
            </div>
          )}

          {loading && ideas.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-surface-container-low h-64 animate-pulse" />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-16 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="font-label font-bold uppercase tracking-[0.25em] text-xs px-12 py-4 text-on-surface hover:bg-on-surface hover:text-surface transition-all duration-300 disabled:opacity-50"
                style={{ border: '1px solid var(--outline-variant)' }}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
