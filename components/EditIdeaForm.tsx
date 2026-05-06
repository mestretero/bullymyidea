'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Idea } from '@/types'
import { CATEGORIES } from '@/lib/categories'
import { LIMITS } from '@/lib/limits'
import { extractYouTubeId } from '@/lib/youtube'
import { useLocale } from '@/components/LanguageProvider'
import type { TranslationKey } from '@/lib/i18n'

interface Props { idea: Idea }

export default function EditIdeaForm({ idea }: Props) {
  const { t } = useLocale()
  const router = useRouter()
  const [title, setTitle] = useState(idea.title)
  const [description, setDescription] = useState(idea.description)
  const [category, setCategory] = useState(idea.category)
  const [tags, setTags] = useState((idea.tags ?? []).join(', '))
  const [youtubeUrl, setYoutubeUrl] = useState(idea.youtube_url ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (title.trim().length < LIMITS.ideaTitle.min || title.trim().length > LIMITS.ideaTitle.max) {
      setError(`Title must be ${LIMITS.ideaTitle.min}-${LIMITS.ideaTitle.max} characters`)
      return
    }
    if (description.trim().length < LIMITS.ideaDescription.min || description.trim().length > LIMITS.ideaDescription.max) {
      setError(`Description must be ${LIMITS.ideaDescription.min}-${LIMITS.ideaDescription.max} characters`)
      return
    }
    if (youtubeUrl.trim() && !extractYouTubeId(youtubeUrl)) {
      setError('Invalid YouTube URL')
      return
    }

    setSaving(true)
    const tagList = tags.split(',').map(s => s.trim()).filter(Boolean)
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, tags: tagList, youtube_url: youtubeUrl }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
    router.push(`/idea/${idea.id}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <Link href={`/idea/${idea.id}`} className="font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white no-underline">
            ← Back to idea
          </Link>
          <h1 className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mt-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
            Edit idea
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="group">
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant flex items-center justify-between mb-2">
              <span>Title</span>
              <span className="text-neutral-700 normal-case tracking-normal">{title.length}/{LIMITS.ideaTitle.max}</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={LIMITS.ideaTitle.max}
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface text-xl font-headline italic focus:ring-0 focus:outline-none focus:border-primary placeholder-on-surface-variant/30"
              style={{ borderBottomWidth: 1, borderRadius: 0 }}
            />
          </div>

          <div className="group">
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant flex items-center justify-between mb-2">
              <span>Description</span>
              <span className="text-neutral-700 normal-case tracking-normal">{description.length}/{LIMITS.ideaDescription.max}</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={6}
              maxLength={LIMITS.ideaDescription.max}
              className="w-full bg-surface-container-low border border-outline-variant/30 py-4 px-5 text-on-surface font-body focus:ring-0 focus:outline-none focus:border-primary resize-vertical"
              style={{ borderRadius: 0 }}
            />
          </div>

          <div>
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-2">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full bg-surface-container-low border border-outline-variant/30 py-4 px-5 text-on-surface font-body focus:ring-0 focus:outline-none focus:border-primary appearance-none cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{t(`catName.${c.value}` as TranslationKey)}</option>)}
            </select>
          </div>

          <div>
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-2">
              Tags <span className="opacity-50">(comma-separated)</span>
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="ai, saas, b2b"
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface font-body focus:ring-0 focus:outline-none focus:border-primary"
              style={{ borderBottomWidth: 1, borderRadius: 0 }}
            />
          </div>

          <div>
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-2">YouTube link <span className="opacity-50">(optional)</span></label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface font-body focus:ring-0 focus:outline-none focus:border-primary"
              style={{ borderBottomWidth: 1, borderRadius: 0 }}
            />
          </div>

          {error && <p className="font-label text-xs text-error uppercase tracking-wide">{error}</p>}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-black font-label font-black uppercase tracking-[0.2em] py-6 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ borderRadius: 0 }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link
              href={`/idea/${idea.id}`}
              className="font-label text-xs uppercase tracking-widest text-neutral-500 hover:text-white py-6 px-8 no-underline border border-white/10"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
