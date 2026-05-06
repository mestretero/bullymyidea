'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { toast } from 'sonner'

interface Report {
  id: string
  idea_id: string | null
  feedback_id: string | null
  reason: string
  status: 'open' | 'resolved'
  created_at: string
  resolved_at: string | null
  admin_note: string | null
  reporter_username: string | null
  resolver_username: string | null
  idea: { id: string; title: string; status: string; user_id: string } | null
  feedback: { id: string; idea_id: string; user_id: string; strengths: string; weaknesses: string; suggestions: string } | null
}

export default function AdminReportsView() {
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?status=${tab}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setReports(data.reports ?? [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab])

  async function act(reportId: string, action: 'dismiss' | 'archive_idea' | 'delete_idea' | 'delete_feedback', note?: string) {
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error ?? 'Failed')
      return
    }
    toast.success({
      dismiss: 'Report dismissed',
      archive_idea: 'Idea archived',
      delete_idea: 'Idea deleted',
      delete_feedback: 'Feedback deleted',
    }[action])
    load()
  }

  return (
    <div>
      <div className="flex gap-6 mb-8">
        <button
          onClick={() => setTab('open')}
          aria-pressed={tab === 'open'}
          className={`font-label text-xs uppercase tracking-widest font-bold pb-2 transition-colors ${tab === 'open' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 hover:text-white'}`}
        >
          Open
        </button>
        <button
          onClick={() => setTab('resolved')}
          aria-pressed={tab === 'resolved'}
          className={`font-label text-xs uppercase tracking-widest font-bold pb-2 transition-colors ${tab === 'resolved' ? 'text-primary border-b-2 border-primary' : 'text-neutral-500 hover:text-white'}`}
        >
          Resolved
        </button>
      </div>

      {loading && <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant py-10 text-center">Loading…</p>}

      {!loading && reports.length === 0 && (
        <div className="py-20 text-center">
          <p className="font-headline italic text-2xl text-on-surface mb-2">No {tab} reports.</p>
          <p className="font-body text-sm text-on-surface-variant">All quiet on the moderation front.</p>
        </div>
      )}

      <div className="space-y-4">
        {reports.map(r => (
          <ReportRow key={r.id} report={r} act={act} tab={tab} />
        ))}
      </div>
    </div>
  )
}

function ReportRow({ report, act, tab }: { report: Report; act: (id: string, a: any, note?: string) => void; tab: 'open' | 'resolved' }) {
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: enUS })
  const target = report.idea_id ? 'Idea' : 'Feedback'
  const targetLink = report.idea_id
    ? `/idea/${report.idea_id}`
    : report.feedback?.idea_id ? `/idea/${report.feedback.idea_id}` : '/'
  const fbPreview = report.feedback
    ? [report.feedback.strengths, report.feedback.weaknesses, report.feedback.suggestions]
        .filter(Boolean).join(' · ').slice(0, 200)
    : ''

  return (
    <div className="bg-surface-container-low border border-white/5 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-error/20 text-error font-label text-[10px] uppercase tracking-widest px-2 py-1 font-bold">
            {target}
          </span>
          <Link
            href={targetLink}
            target="_blank"
            className="font-headline italic text-lg text-on-surface hover:text-primary no-underline"
          >
            {report.idea?.title ?? (report.feedback ? 'View feedback →' : '(deleted)')}
          </Link>
          {report.idea?.status === 'archived' && (
            <span className="font-label text-[9px] uppercase text-neutral-500 tracking-widest">archived</span>
          )}
        </div>
        <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500">{timeAgo}</span>
      </div>

      {fbPreview && (
        <p className="font-body text-sm text-on-surface-variant italic mb-4 line-clamp-3">"{fbPreview}"</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">Reason</span>
          <p className="font-body text-sm text-on-surface">{report.reason || <span className="text-neutral-600 italic">no reason given</span>}</p>
        </div>
        <div>
          <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">Reporter</span>
          <p className="font-body text-sm text-on-surface">
            {report.reporter_username ? `@${report.reporter_username}` : <span className="text-neutral-600">unknown</span>}
          </p>
        </div>
      </div>

      {tab === 'resolved' && report.admin_note && (
        <div className="mb-4 px-4 py-3 bg-black/30 border-l-2 border-primary">
          <span className="font-label text-[9px] uppercase tracking-widest text-neutral-500 block">
            Resolved by {report.resolver_username ? `@${report.resolver_username}` : 'admin'}
          </span>
          <p className="font-body text-sm text-on-surface mt-1">{report.admin_note}</p>
        </div>
      )}

      {tab === 'open' && (
        <div className="flex gap-3 flex-wrap pt-3 border-t border-white/5">
          <button
            onClick={() => act(report.id, 'dismiss')}
            className="font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors px-4 py-2"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Dismiss
          </button>
          {report.idea_id && (
            <>
              <button
                onClick={() => act(report.id, 'archive_idea')}
                className="font-label text-[10px] uppercase tracking-widest text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-colors px-4 py-2"
              >
                Archive idea
              </button>
              <button
                onClick={() => {
                  if (confirm('Permanently delete this idea? Cascades through feedbacks/votes.')) act(report.id, 'delete_idea')
                }}
                className="font-label text-[10px] uppercase tracking-widest text-white bg-error hover:brightness-110 transition-all px-4 py-2"
              >
                Delete idea
              </button>
            </>
          )}
          {report.feedback_id && (
            <button
              onClick={() => {
                if (confirm('Permanently delete this feedback?')) act(report.id, 'delete_feedback')
              }}
              className="font-label text-[10px] uppercase tracking-widest text-white bg-error hover:brightness-110 transition-all px-4 py-2"
            >
              Delete feedback
            </button>
          )}
        </div>
      )}
    </div>
  )
}
