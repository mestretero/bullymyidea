'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Entry {
  id: string
  admin_id: string
  admin_username: string | null
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, any>
  created_at: string
}

const ACTION_LABEL: Record<string, string> = {
  user_delete: 'deleted user',
  idea_archive: 'archived idea',
  idea_delete: 'deleted idea',
  feedback_delete: 'deleted feedback',
  report_resolve: 'resolved report',
}

const ACTION_COLOR: Record<string, string> = {
  user_delete: '#ff7351',
  idea_delete: '#ff7351',
  feedback_delete: '#ff7351',
  idea_archive: '#f6ad55',
  report_resolve: '#f3ffca',
}

export default function AdminAuditView() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/audit')
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? 'Failed')
        setEntries(d.entries ?? [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant py-20 text-center">Loading audit log…</p>
  }
  if (error) {
    return <p className="font-label text-error text-sm py-20 text-center">{error}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline italic text-2xl text-on-surface">Audit log</h2>
        <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500">
          {entries.length} entries · last 200
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="bg-surface-container-low border border-white/5 p-10 text-center">
          <p className="font-headline italic text-xl text-on-surface mb-1">No admin actions yet.</p>
          <p className="font-body text-sm text-on-surface-variant">Every destructive admin action will be logged here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/5 bg-surface-container-low border border-white/5">
          {entries.map(e => {
            const color = ACTION_COLOR[e.action] ?? '#adaaaa'
            return (
              <li key={e.id} className="px-5 py-4 flex items-start gap-4 flex-wrap">
                <span
                  className="font-label text-[9px] uppercase tracking-widest px-2 py-1 font-bold flex-shrink-0"
                  style={{ background: `${color}22`, color }}
                >
                  {e.action.replace('_', ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-on-surface">
                    <strong>{e.admin_username ? `@${e.admin_username}` : 'admin'}</strong>{' '}
                    <span className="text-on-surface-variant">{ACTION_LABEL[e.action] ?? e.action}</span>
                    {e.target_id && <span className="text-neutral-600 ml-2 font-mono text-xs">{e.target_id.slice(0, 8)}…</span>}
                  </p>
                  {e.metadata && Object.keys(e.metadata).length > 0 && (
                    <p className="font-mono text-[10px] text-neutral-600 mt-1 truncate">
                      {JSON.stringify(e.metadata)}
                    </p>
                  )}
                </div>
                <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                  {format(new Date(e.created_at), 'MMM d, HH:mm:ss')}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
