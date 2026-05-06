'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'feedback_received' | 'vote_received'
  idea_id: string | null
  feedback_id: string | null
  actor: { id: string; username: string | null; avatar_url: string | null } | null
  idea: { id: string; title: string } | null
  metadata: { vote_type?: 'up' | 'down' }
  read_at: string | null
  created_at: string
}

export default function NotificationBell({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [stopped, setStopped] = useState(false)

  async function load() {
    if (stopped) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.status === 401) {
        // Session expired — stop polling rather than spamming 401s.
        setStopped(true)
        return
      }
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnread(data.unread ?? 0)
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    if (unread === 0) return
    await fetch('/api/notifications', { method: 'PATCH' })
    setUnread(0)
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  useEffect(() => {
    if (!enabled || stopped) return
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, stopped])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!enabled) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setOpen(o => !o)
          if (!open && unread > 0) markAllRead()
        }}
        className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-primary hover:bg-primary/5 transition-all relative"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary text-black font-label font-black text-[9px] flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-[360px] max-h-[480px] overflow-y-auto bg-surface-container-high border border-white/10 shadow-xl">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-surface-container-high">
            <span className="font-label text-[11px] uppercase tracking-[0.25em] text-on-surface">Notifications</span>
            <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500">{unread} new</span>
          </div>

          {loading && notifications.length === 0 && (
            <p className="px-5 py-12 text-center font-label text-[10px] uppercase tracking-widest text-neutral-500">Loading...</p>
          )}

          {!loading && notifications.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="font-headline italic text-on-surface mb-2">All quiet.</p>
              <p className="font-body text-xs text-on-surface-variant">No bullies, no votes. Yet.</p>
            </div>
          )}

          {notifications.map(n => (
            <NotifItem key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotifItem({ n }: { n: Notification }) {
  const timeAgo = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: enUS })
  const actor = n.actor?.username ? `@${n.actor.username}` : 'Someone'
  const ideaTitle = n.idea?.title ?? 'an idea'

  let icon = 'comment'
  let text: React.ReactNode = ''
  if (n.type === 'feedback_received') {
    icon = 'comment'
    text = <><strong className="text-on-surface">{actor}</strong> critiqued your idea <em className="text-primary not-italic">{ideaTitle}</em></>
  } else if (n.type === 'vote_received') {
    icon = n.metadata?.vote_type === 'up' ? 'arrow_upward' : 'arrow_downward'
    text = <><strong className="text-on-surface">{actor}</strong> {n.metadata?.vote_type === 'up' ? 'upvoted' : 'downvoted'} your critique on <em className="text-primary not-italic">{ideaTitle}</em></>
  }

  const href = n.idea_id ? `/idea/${n.idea_id}` : '/'
  const isUnread = !n.read_at

  return (
    <Link
      href={href}
      className={`block px-5 py-4 border-b border-white/5 hover:bg-surface-container-highest transition-colors no-underline ${isUnread ? 'bg-primary/5' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-surface-container-highest flex-shrink-0 flex items-center justify-center mt-0.5">
          {n.actor?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 16 }}>{icon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-on-surface-variant leading-snug line-clamp-3">{text}</p>
          <p className="font-label text-[9px] uppercase tracking-widest text-neutral-600 mt-1">{timeAgo}</p>
        </div>
        {isUnread && <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />}
      </div>
    </Link>
  )
}
