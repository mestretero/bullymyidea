'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import IdeaCard from '@/components/IdeaCard'
import { CATEGORIES } from '@/lib/categories'
import type { Idea } from '@/types'

interface ProfileResult {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
}

type SortMode = 'recent' | 'bullied'

interface Props {
  initialQuery: string
  initialCategory?: string
  initialTag?: string
  initialSort?: SortMode
}

export default function SearchView({ initialQuery, initialCategory = '', initialTag = '', initialSort = 'recent' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [tag, setTag] = useState(initialTag)
  const [sort, setSort] = useState<SortMode>(initialSort)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [profiles, setProfiles] = useState<ProfileResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function runSearch(q: string, cat: string, tg: string, srt: SortMode) {
    if (!q.trim() && !cat && !tg) {
      setIdeas([]); setProfiles([]); setSearched(false)
      return
    }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (cat) params.set('category', cat)
      if (tg) params.set('tag', tg)
      if (srt !== 'recent') params.set('sort', srt)
      const res = await fetch(`/api/search?${params}`, { signal: ctrl.signal })
      if (!res.ok) throw new Error('search failed')
      const data = await res.json()
      setIdeas(data.ideas ?? [])
      setProfiles(data.profiles ?? [])
      setSearched(true)
    } catch (e: any) {
      if (e?.name === 'AbortError') return
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuery || initialCategory || initialTag) {
      runSearch(initialQuery, initialCategory, initialTag, initialSort)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushUrl(q: string, cat: string, tg: string, srt: SortMode) {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (cat) params.set('category', cat)
    if (tg) params.set('tag', tg)
    if (srt !== 'recent') params.set('sort', srt)
    const qs = params.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }

  function onQueryChange(v: string) {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(v, category, tag, sort)
      pushUrl(v, category, tag, sort)
    }, 300)
  }

  function setFilter(next: { category?: string; tag?: string; sort?: SortMode }) {
    const newCat = next.category !== undefined ? next.category : category
    const newTag = next.tag !== undefined ? next.tag : tag
    const newSort = next.sort !== undefined ? next.sort : sort
    setCategory(newCat); setTag(newTag); setSort(newSort)
    runSearch(query, newCat, newTag, newSort)
    pushUrl(query, newCat, newTag, newSort)
  }

  const filterChips = [
    { value: '', label: 'All' },
    ...CATEGORIES.map(c => ({ value: c.value, label: c.label })),
  ]

  const hasFilters = !!category || !!tag

  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-6xl mx-auto">
        <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">Search</span>
        <h1
          className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-8"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Hunt the brutal.
        </h1>

        <div className="relative mb-6">
          <span aria-hidden="true" className="absolute left-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant" style={{ fontSize: 24 }}>search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Idea title, keyword, or @username"
            maxLength={80}
            aria-label="Search query"
            className="w-full bg-transparent border-0 border-b border-outline-variant pl-10 pr-4 py-5 text-on-surface text-2xl font-headline italic focus:ring-0 focus:outline-none focus:border-primary transition-all placeholder-on-surface-variant/30"
          />
        </div>

        {/* Filters toolbar — top edge with sort, then chips below, then tag */}
        <div className="border-y border-white/10 mb-12">
          {/* Row 1: section label + sort (right) */}
          <div className="flex items-center justify-between px-1 py-3 border-b border-white/5">
            <span className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">Filters</span>
            <div className="flex items-center gap-5">
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-neutral-600">Sort</span>
              <button
                onClick={() => setFilter({ sort: 'recent' })}
                aria-pressed={sort === 'recent'}
                className={`font-label text-[10px] uppercase tracking-widest font-bold pb-1 transition-colors ${sort === 'recent' ? 'text-primary border-b border-primary' : 'text-neutral-500 hover:text-white'}`}
              >
                Newest
              </button>
              <button
                onClick={() => setFilter({ sort: 'bullied' })}
                aria-pressed={sort === 'bullied'}
                className={`font-label text-[10px] uppercase tracking-widest font-bold pb-1 transition-colors ${sort === 'bullied' ? 'text-primary border-b border-primary' : 'text-neutral-500 hover:text-white'}`}
              >
                Most bullied
              </button>
            </div>
          </div>

          {/* Row 2: category chips */}
          <div className="flex items-center gap-3 flex-wrap px-1 py-4 border-b border-white/5">
            <span className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant whitespace-nowrap mr-2">Category</span>
            {filterChips.map(c => {
              const active = category === c.value
              return (
                <button
                  key={c.value || 'all'}
                  onClick={() => setFilter({ category: c.value })}
                  aria-pressed={active}
                  className="font-label text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 transition-colors"
                  style={{
                    background: active ? 'var(--primary)' : 'var(--surface-highest)',
                    color: active ? '#000' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {c.label}
                </button>
              )
            })}
          </div>

          {/* Row 3: tag input */}
          <div className="flex items-center gap-3 px-1 py-3">
            <span className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant whitespace-nowrap mr-2">Tag</span>
            <input
              type="text"
              value={tag}
              onChange={e => {
                const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                setTag(cleaned)
                if (debounceRef.current) clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => {
                  runSearch(query, category, cleaned, sort)
                  pushUrl(query, category, cleaned, sort)
                }, 300)
              }}
              placeholder="ai, saas, b2b…"
              maxLength={30}
              aria-label="Filter by tag"
              className="bg-transparent border-0 border-b border-transparent focus:border-primary px-2 py-1 text-sm font-body text-on-surface focus:ring-0 outline-none w-full max-w-xs placeholder-on-surface-variant/40"
            />
            {tag && (
              <button
                onClick={() => setFilter({ tag: '' })}
                aria-label="Clear tag filter"
                className="font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-error transition-colors ml-auto"
              >
                Clear ×
              </button>
            )}
          </div>
        </div>

        {loading && (
          <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant py-10 text-center">Searching...</p>
        )}

        {!loading && searched && ideas.length === 0 && profiles.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-headline italic text-3xl text-on-surface mb-3">Nothing found.</p>
            <p className="font-body text-on-surface-variant">
              {hasFilters
                ? 'Try removing a filter or different keywords.'
                : 'Try different keywords. The brutal truth might be hiding under a different name.'}
            </p>
          </div>
        )}

        {!loading && profiles.length > 0 && (
          <section className="mb-16">
            <h2 className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant mb-6">
              Profiles ({profiles.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map(p => (
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  className="bg-surface-container-low border border-white/5 hover:border-primary/40 transition-colors p-5 flex items-center gap-4 no-underline group"
                >
                  <div className="w-12 h-12 bg-surface-container-highest flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: 28 }}>account_circle</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-headline italic font-bold text-lg text-on-surface block truncate group-hover:text-primary transition-colors">@{p.username}</span>
                    {p.bio && <p className="font-body text-xs text-on-surface-variant line-clamp-1 mt-0.5">{p.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && ideas.length > 0 && (
          <section>
            <h2 className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant mb-6">
              Ideas ({ideas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
