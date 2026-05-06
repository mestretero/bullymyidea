'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface AdminUserRow {
  id: string
  email: string | null
  username: string | null
  avatar_url: string | null
  is_admin: boolean
  is_anonymous: boolean
  created_at: string
  last_sign_in_at: string | null
  ideas_active: number
  ideas_archived: number
  feedbacks_given: number
}

export default function AdminUsersView() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filter, setFilter] = useState('')

  async function load(p: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${p}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setUsers(data.users ?? [])
      setHasMore(!!data.has_more)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  const visible = users.filter(u => {
    if (!filter) return true
    const f = filter.toLowerCase()
    return (u.email ?? '').toLowerCase().includes(f) || (u.username ?? '').toLowerCase().includes(f)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-headline italic text-2xl text-on-surface">All users</h2>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by email or username…"
          className="bg-surface-container-low border border-white/5 px-4 py-2 text-sm font-body text-on-surface focus:border-primary focus:ring-0 outline-none w-full md:w-80"
        />
      </div>

      {loading && <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant py-10 text-center">Loading…</p>}

      {!loading && (
        <div className="bg-surface-container-low border border-white/5 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10">
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th align="right">Ideas</Th>
                <Th align="right">Critiques</Th>
                <Th>Joined</Th>
                <Th>Last seen</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-surface-container-high transition-colors">
                  <Td>
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 no-underline group">
                      <div className="w-9 h-9 bg-surface-container-highest flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: 22 }}>account_circle</span>
                        )}
                      </div>
                      <div>
                        <span className="font-headline italic font-bold text-base text-on-surface group-hover:text-primary transition-colors block">
                          {u.username ? `@${u.username}` : <span className="text-neutral-500">no username</span>}
                        </span>
                        <span className="flex gap-1 mt-0.5">
                          {u.is_admin && <Badge>admin</Badge>}
                          {u.is_anonymous && <Badge color="neutral">anon</Badge>}
                        </span>
                      </div>
                    </Link>
                  </Td>
                  <Td>
                    <span className="font-body text-xs text-on-surface-variant truncate max-w-[200px] block">{u.email ?? '—'}</span>
                  </Td>
                  <Td align="right">
                    <span className="font-headline italic font-black text-lg text-on-surface">{u.ideas_active}</span>
                    {u.ideas_archived > 0 && (
                      <span className="font-label text-[9px] uppercase tracking-widest text-neutral-500 ml-1">+{u.ideas_archived} arch</span>
                    )}
                  </Td>
                  <Td align="right">
                    <span className="font-headline italic font-black text-lg text-primary">{u.feedbacks_given}</span>
                  </Td>
                  <Td>
                    <span className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                      {u.last_sign_in_at
                        ? formatDistanceToNow(new Date(u.last_sign_in_at), { addSuffix: true, locale: enUS })
                        : <span className="text-neutral-600">never</span>}
                    </span>
                  </Td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 font-label text-xs uppercase tracking-widest text-neutral-500">
                    {filter ? 'No matches' : 'No users'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors px-4 py-2"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          ← Prev
        </button>
        <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!hasMore || loading}
          className="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors px-4 py-2"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th className={`px-4 py-3 font-label text-[10px] uppercase tracking-widest text-neutral-500 font-bold ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}

function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <td className={`px-4 py-3 align-middle ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </td>
  )
}

function Badge({ children, color = 'primary' }: { children: React.ReactNode; color?: 'primary' | 'neutral' }) {
  const styles = color === 'primary'
    ? 'bg-primary/20 text-primary'
    : 'bg-white/5 text-neutral-400'
  return (
    <span className={`inline-block ${styles} font-label text-[8px] uppercase tracking-widest px-1.5 py-0.5 font-bold`}>
      {children}
    </span>
  )
}
