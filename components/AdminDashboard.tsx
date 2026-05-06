'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface Stats {
  counts: {
    open_reports: number
    total_ideas: number
    archived_ideas: number
    total_feedbacks: number
    total_profiles: number
    ideas_24h: number
    feedbacks_24h: number
    profiles_24h: number
  }
  recent_reports: Array<{
    id: string
    idea_id: string | null
    feedback_id: string | null
    reason: string
    created_at: string
    reporter_username: string | null
    idea_title: string | null
  }>
  recent_ideas: Array<{
    id: string
    title: string
    created_at: string
    author_username: string | null
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? 'Failed')
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant py-20 text-center">Loading dashboard…</p>
  }
  if (error || !data) {
    return <p className="font-label text-error text-sm py-20 text-center">{error ?? 'No data'}</p>
  }

  const { counts, recent_reports, recent_ideas } = data
  const openReportsHigh = counts.open_reports >= 5

  return (
    <div className="space-y-12">

      {/* ── HERO METRIC: open reports ──────────────────────── */}
      <section
        className={`p-8 md:p-10 ${openReportsHigh ? 'bg-error/10 border-2 border-error/40' : 'bg-surface-container-low border border-white/10'}`}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className={`font-label text-[10px] uppercase tracking-[0.3em] ${openReportsHigh ? 'text-error' : 'text-on-surface-variant'} block mb-2`}>
              {openReportsHigh ? 'Needs attention' : 'Moderation queue'}
            </span>
            <div className="flex items-baseline gap-4">
              <span className={`font-headline italic font-black leading-none ${openReportsHigh ? 'text-error' : 'text-primary'}`} style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}>
                {counts.open_reports}
              </span>
              <span className="font-headline italic text-3xl text-on-surface-variant">
                open report{counts.open_reports === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <Link
            href="/admin/reports"
            className="bg-primary text-black font-label font-black uppercase tracking-[0.2em] text-sm px-8 py-4 hover:brightness-110 transition-all no-underline self-end"
          >
            Open queue →
          </Link>
        </div>
      </section>

      {/* ── COUNTS GRID ────────────────────────────────────── */}
      <section>
        <h2 className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant mb-4">Platform totals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          <Stat label="Active ideas" value={counts.total_ideas} delta={counts.ideas_24h} deltaLabel="last 24h" />
          <Stat label="Critiques" value={counts.total_feedbacks} delta={counts.feedbacks_24h} deltaLabel="last 24h" />
          <Stat label="Users" value={counts.total_profiles} delta={counts.profiles_24h} deltaLabel="signups 24h" />
          <Stat label="Archived" value={counts.archived_ideas} muted />
        </div>
      </section>

      {/* ── RECENT REPORTS PREVIEW ─────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant">Latest open reports</h2>
          <Link href="/admin/reports" className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary no-underline">
            View all →
          </Link>
        </div>
        {recent_reports.length === 0 ? (
          <div className="bg-surface-container-low border border-white/5 p-8 text-center">
            <p className="font-headline italic text-xl text-on-surface mb-1">All clear.</p>
            <p className="font-body text-sm text-on-surface-variant">No open reports right now.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5 bg-surface-container-low border border-white/5">
            {recent_reports.map(r => (
              <li key={r.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <span className="bg-error/20 text-error font-label text-[9px] uppercase tracking-widest px-2 py-1 font-bold flex-shrink-0">
                  {r.idea_id ? 'Idea' : 'Feedback'}
                </span>
                <span className="font-body text-sm text-on-surface flex-1 min-w-0 truncate">
                  {r.idea_title ?? <span className="text-neutral-600 italic">(no title)</span>}
                </span>
                <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500">
                  by {r.reporter_username ? `@${r.reporter_username}` : 'unknown'} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: enUS })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── RECENT IDEAS ───────────────────────────────────── */}
      <section>
        <h2 className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant mb-4">Recent ideas (last 7 days)</h2>
        {recent_ideas.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant py-6">No new ideas this week.</p>
        ) : (
          <ul className="divide-y divide-white/5 bg-surface-container-low border border-white/5">
            {recent_ideas.map(i => (
              <li key={i.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <Link
                  href={`/idea/${i.id}`}
                  target="_blank"
                  className="font-headline italic text-base text-on-surface hover:text-primary no-underline flex-1 min-w-0 truncate"
                >
                  {i.title}
                </Link>
                <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                  {i.author_username ? `@${i.author_username}` : 'anonymous'} · {formatDistanceToNow(new Date(i.created_at), { addSuffix: true, locale: enUS })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, delta, deltaLabel, muted }: { label: string; value: number; delta?: number; deltaLabel?: string; muted?: boolean }) {
  return (
    <div className={`p-6 ${muted ? 'bg-surface-container-lowest border-l border-white/5' : 'bg-surface-container-low border-l-2 border-primary/30'}`}>
      <span className="font-label text-[10px] uppercase tracking-[0.2em] text-neutral-500 block mb-2">{label}</span>
      <span className="font-headline italic font-black text-4xl text-on-surface block leading-none">{value.toLocaleString('en')}</span>
      {delta !== undefined && (
        <span className="font-label text-[10px] uppercase tracking-widest text-primary mt-3 block">
          +{delta} {deltaLabel}
        </span>
      )}
    </div>
  )
}
