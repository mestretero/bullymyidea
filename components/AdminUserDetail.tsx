'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { toast } from 'sonner'

interface UserDetail {
  user: {
    id: string
    email: string | null
    username: string | null
    avatar_url: string | null
    bio: string | null
    is_admin: boolean
    is_anonymous: boolean
    email_confirmed_at: string | null
    created_at: string
    last_sign_in_at: string | null
    provider: string | null
  }
  ideas: Array<{
    id: string
    title: string
    status: 'active' | 'archived'
    created_at: string
    category: string
    tags: string[]
    feedback_count: number
  }>
  feedbacks: Array<{
    id: string
    idea_id: string
    idea_title: string | null
    strengths: string
    weaknesses: string
    suggestions: string
    created_at: string
    vote_counts: { up: number; down: number }
  }>
  counts: {
    ideas_active: number
    ideas_archived: number
    feedbacks_given: number
    votes_cast: number
  }
}

export default function AdminUserDetail({ userId }: { userId: string }) {
  const router = useRouter()
  const [data, setData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      setData(d)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  async function deleteIdea(ideaId: string, title: string) {
    if (!confirm(`Permanently delete "${title}"? This is irreversible.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/ideas/${ideaId}`, { method: 'DELETE' })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? 'Delete failed')
      return
    }
    toast.success('Idea deleted')
    load()
  }

  async function deleteFeedback(fbId: string) {
    if (!confirm('Permanently delete this critique?')) return
    setBusy(true)
    const res = await fetch(`/api/admin/feedbacks/${fbId}`, { method: 'DELETE' })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? 'Delete failed')
      return
    }
    toast.success('Critique deleted')
    load()
  }

  async function deleteAccount() {
    if (!data) return
    const handle = data.user.username ? `@${data.user.username}` : data.user.email ?? 'this user'
    if (!confirm(`PERMANENTLY delete ${handle} and all their content? This cascades through ideas, critiques, votes, bookmarks. Cannot be undone.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? 'Delete failed')
      return
    }
    toast.success('User deleted')
    router.push('/admin/users')
  }

  if (loading) {
    return <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant py-20 text-center">Loading…</p>
  }
  if (error || !data) {
    return <p className="font-label text-error text-sm py-20 text-center">{error ?? 'No data'}</p>
  }

  const { user, ideas, feedbacks, counts } = data

  return (
    <div className="space-y-12">
      <Link href="/admin/users" className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary no-underline inline-block">
        ← All users
      </Link>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-32 h-32 bg-surface-container-highest flex-shrink-0 overflow-hidden flex items-center justify-center">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: 80 }}>account_circle</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            {user.is_admin && <span className="bg-primary/20 text-primary font-label text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Admin</span>}
            {user.is_anonymous && <span className="bg-white/5 text-neutral-400 font-label text-[10px] uppercase tracking-widest px-2 py-1 font-bold">Anonymous</span>}
            {user.provider && <span className="bg-white/5 text-neutral-400 font-label text-[10px] uppercase tracking-widest px-2 py-1 font-bold">{user.provider}</span>}
          </div>
          <h2 className="font-headline italic font-black text-4xl text-on-surface mb-1">
            {user.username ? `@${user.username}` : <span className="text-neutral-500">no username</span>}
          </h2>
          {user.email && <p className="font-body text-sm text-on-surface-variant mb-4">{user.email}</p>}
          {user.bio && <p className="font-body text-sm text-on-surface mb-4 max-w-xl">{user.bio}</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Meta label="Joined" value={format(new Date(user.created_at), 'MMM d, yyyy')} />
            <Meta
              label="Last seen"
              value={user.last_sign_in_at
                ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true, locale: enUS })
                : 'never'}
            />
            <Meta
              label="Email confirmed"
              value={user.email_confirmed_at ? 'yes' : (user.email ? 'no' : 'n/a')}
            />
            <Meta label="User ID" value={user.id.slice(0, 8) + '…'} mono />
          </div>
        </div>
      </header>

      {/* ── COUNTS ─────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-1">
        <Stat label="Active ideas" value={counts.ideas_active} />
        <Stat label="Archived" value={counts.ideas_archived} muted />
        <Stat label="Critiques given" value={counts.feedbacks_given} accent />
        <Stat label="Votes cast" value={counts.votes_cast} muted />
      </section>

      {/* ── IDEAS ──────────────────────────────────────────── */}
      <section>
        <h3 className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant mb-4">
          Ideas ({ideas.length})
        </h3>
        {ideas.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant py-6">No ideas posted.</p>
        ) : (
          <ul className="divide-y divide-white/5 bg-surface-container-low border border-white/5">
            {ideas.map(i => (
              <li key={i.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <span className={`font-label text-[9px] uppercase tracking-widest px-2 py-1 font-bold flex-shrink-0 ${
                  i.status === 'archived' ? 'bg-white/5 text-neutral-500' : 'bg-primary/20 text-primary'
                }`}>
                  {i.status}
                </span>
                <Link href={`/idea/${i.id}`} target="_blank" className="font-headline italic text-base text-on-surface hover:text-primary no-underline flex-1 min-w-0 truncate">
                  {i.title}
                </Link>
                <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                  {i.feedback_count} crit · {format(new Date(i.created_at), 'MMM d')}
                </span>
                <button
                  onClick={() => deleteIdea(i.id, i.title)}
                  disabled={busy}
                  className="font-label text-[10px] uppercase tracking-widest text-error/80 hover:text-error transition-colors px-3 py-1 disabled:opacity-50"
                  style={{ border: '1px solid rgba(255,115,81,0.3)' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── FEEDBACKS ──────────────────────────────────────── */}
      <section>
        <h3 className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant mb-4">
          Critiques given ({feedbacks.length})
        </h3>
        {feedbacks.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant py-6">No critiques given.</p>
        ) : (
          <ul className="divide-y divide-white/5 bg-surface-container-low border border-white/5">
            {feedbacks.map(f => {
              const preview = [f.strengths, f.weaknesses, f.suggestions].filter(Boolean).join(' · ').slice(0, 200)
              return (
                <li key={f.id} className="px-5 py-4 flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Link href={`/idea/${f.idea_id}`} target="_blank" className="font-headline italic text-sm text-primary hover:underline no-underline block mb-1">
                      → {f.idea_title ?? '(deleted idea)'}
                    </Link>
                    <p className="font-body text-sm text-on-surface-variant line-clamp-2 italic">"{preview}"</p>
                    <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500 mt-1 inline-block">
                      ↑{f.vote_counts.up} ↓{f.vote_counts.down} · {format(new Date(f.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteFeedback(f.id)}
                    disabled={busy}
                    className="font-label text-[10px] uppercase tracking-widest text-error/80 hover:text-error transition-colors px-3 py-1 disabled:opacity-50 flex-shrink-0"
                    style={{ border: '1px solid rgba(255,115,81,0.3)' }}
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ── DANGER ZONE ────────────────────────────────────── */}
      <section className="border-2 border-error/40 bg-error/5 p-6">
        <h3 className="font-headline italic text-xl text-error mb-2">Danger zone</h3>
        <p className="font-body text-sm text-on-surface-variant mb-4">
          Deleting this user removes their account and cascades through all their content (ideas, critiques, votes, bookmarks).
          This cannot be undone.
        </p>
        <button
          onClick={deleteAccount}
          disabled={busy}
          className="bg-error text-white font-label font-bold py-2 px-6 uppercase text-xs tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
        >
          {busy ? 'Deleting…' : 'Delete account'}
        </button>
      </section>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="font-label text-[9px] uppercase tracking-widest text-neutral-500 block mb-1">{label}</span>
      <span className={`text-on-surface text-sm ${mono ? 'font-mono' : 'font-body'}`}>{value}</span>
    </div>
  )
}

function Stat({ label, value, accent, muted }: { label: string; value: number; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`p-6 ${muted ? 'bg-surface-container-lowest border-l border-white/5' : 'bg-surface-container-low border-l-2 border-primary/30'}`}>
      <span className="font-label text-[10px] uppercase tracking-[0.2em] text-neutral-500 block mb-2">{label}</span>
      <span className={`font-headline italic font-black text-3xl block leading-none ${accent ? 'text-primary' : 'text-on-surface'}`}>
        {value.toLocaleString('en')}
      </span>
    </div>
  )
}
