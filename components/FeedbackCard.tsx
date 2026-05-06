'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Feedback } from '@/types'
import VoteButtons from './VoteButtons'
import ReportButton from './ReportButton'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useLocale } from '@/components/LanguageProvider'
import { LIMITS } from '@/lib/limits'
import { toast } from 'sonner'

interface Props {
  feedback: Feedback
  isOwner?: boolean
}

export default function FeedbackCard({ feedback, isOwner = false }: Props) {
  const { t } = useLocale()
  const router = useRouter()
  const timeAgo = formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: enUS })

  const [editing, setEditing] = useState(false)
  const [strengths, setStrengths] = useState(feedback.strengths)
  const [weaknesses, setWeaknesses] = useState(feedback.weaknesses)
  const [suggestions, setSuggestions] = useState(feedback.suggestions)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function save() {
    if (!strengths.trim() && !weaknesses.trim() && !suggestions.trim()) {
      setError('Fill in at least one field')
      return
    }
    setBusy(true); setError(null)
    const res = await fetch(`/api/feedbacks/${feedback.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strengths, weaknesses, suggestions }),
    })
    setBusy(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); toast.error(d.error ?? 'Failed'); return }
    setEditing(false)
    toast.success('Critique updated')
    router.refresh()
  }

  async function remove() {
    setBusy(true)
    const res = await fetch(`/api/feedbacks/${feedback.id}`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) toast.success('Critique deleted')
    router.refresh()
  }

  return (
    <div className={`bg-[#131313] border p-8 relative group transition-all hover:bg-[#1a1919] duration-300 ${isOwner ? 'border-primary/20' : 'border-[#494847]/10'}`}>
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#262626] rounded-full overflow-hidden flex items-center justify-center">
            {feedback.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={feedback.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: 18 }}>account_circle</span>
            )}
          </div>
          <div>
            <p className="font-label font-bold text-sm tracking-tight text-white">
              {feedback.username
                ? `@${feedback.username}`
                : feedback.display_name || t('feedback.anonymous')}
              {isOwner && <span className="ml-2 font-label text-[9px] uppercase tracking-widest text-primary">You</span>}
            </p>
            <p className="text-[9px] uppercase text-neutral-500 tracking-widest">{timeAgo}</p>
          </div>
        </div>
        {!isOwner && <ReportButton feedbackId={feedback.id} />}
      </div>

      {editing ? (
        <div className="space-y-6 mb-8">
          {[
            { label: t('feedback.good'), color: '#f3ffca', value: strengths, set: setStrengths, ph: t('feedback.goodPlaceholder') },
            { label: t('feedback.bad'), color: '#ff7351', value: weaknesses, set: setWeaknesses, ph: t('feedback.badPlaceholder') },
            { label: t('feedback.evolution'), color: '#fb923c', value: suggestions, set: setSuggestions, ph: t('feedback.evolutionPlaceholder') },
          ].map(f => (
            <div key={f.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label text-[10px] uppercase tracking-widest font-bold" style={{ color: f.color }}>{f.label}</label>
                <span className="font-label text-[10px] tracking-widest text-neutral-600">{f.value.length}/{LIMITS.feedbackField}</span>
              </div>
              <textarea
                value={f.value}
                onChange={e => f.set(e.target.value)}
                maxLength={LIMITS.feedbackField}
                rows={3}
                placeholder={f.ph}
                className="w-full bg-black/30 border border-[#494847]/20 p-3 text-sm font-body text-[#e2e2e2] placeholder:text-neutral-700 focus:ring-0 outline-none resize-none"
                style={{ borderColor: f.color + '30' }}
              />
            </div>
          ))}
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-3">
            <button onClick={save} disabled={busy} className="bg-primary text-black font-label font-bold py-2 px-6 uppercase text-xs tracking-widest disabled:opacity-50">
              {busy ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null); setStrengths(feedback.strengths); setWeaknesses(feedback.weaknesses); setSuggestions(feedback.suggestions) }}
              className="font-label text-xs uppercase tracking-widest text-neutral-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-3">
            <h4 className="font-label text-[11px] font-black tracking-widest text-[#f3ffca] uppercase">{t('feedback.good')}</h4>
            <p className="text-sm leading-relaxed text-[#e2e2e2]/90 italic font-medium whitespace-pre-wrap">
              {feedback.strengths ? `"${feedback.strengths}"` : '—'}
            </p>
          </div>
          <div className="space-y-3 border-l md:border-l-0 md:pl-0 pl-6 border-[#494847]/10">
            <h4 className="font-label text-[11px] font-black tracking-widest text-[#ff7351] uppercase">{t('feedback.bad')}</h4>
            <p className="text-sm leading-relaxed text-[#e2e2e2]/90 italic font-medium whitespace-pre-wrap">
              {feedback.weaknesses ? `"${feedback.weaknesses}"` : '—'}
            </p>
          </div>
          <div className="space-y-3 border-l md:border-l-0 md:pl-0 pl-6 border-[#494847]/10">
            <h4 className="font-label text-[11px] font-black tracking-widest text-orange-400 uppercase">{t('feedback.evolution')}</h4>
            <p className="text-sm leading-relaxed text-[#e2e2e2]/90 italic font-medium whitespace-pre-wrap">
              {feedback.suggestions ? `"${feedback.suggestions}"` : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center gap-3 flex-wrap">
        {isOwner ? (
          <div className="flex items-center gap-4">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                Edit
              </button>
            )}
            {!editing && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                Delete
              </button>
            )}
            {confirmDelete && (
              <div className="flex items-center gap-3">
                <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500">Sure?</span>
                <button onClick={remove} disabled={busy} className="font-label text-[10px] uppercase tracking-widest text-error hover:underline">
                  {busy ? '...' : 'Yes, delete'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="font-label text-[10px] uppercase tracking-widest text-neutral-600 hover:text-white">
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : <span />}
        <VoteButtons feedbackId={feedback.id} voteCounts={feedback.vote_counts} userVote={feedback.user_vote} />
      </div>
    </div>
  )
}
