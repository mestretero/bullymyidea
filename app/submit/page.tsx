'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/categories'
import { useLocale } from '@/components/LanguageProvider'
import type { TranslationKey } from '@/lib/i18n'
import { extractYouTubeId } from '@/lib/youtube'
import { LIMITS, MIN_FORM_DWELL_SECONDS } from '@/lib/limits'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function SubmitPage() {
  const { t } = useLocale()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('technology')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [whitepaper, setWhitepaper] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wpInputRef = useRef<HTMLInputElement>(null)
  const formLoadedAtRef = useRef(Date.now())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (!user || user.is_anonymous) router.replace('/auth')
    })
  }, [])

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    setError(null)
    const incoming = Array.from(newFiles)
    const rejected: string[] = []
    const allowed = incoming.filter(f => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        rejected.push(`${f.name}: format not allowed`)
        return false
      }
      if (f.size > LIMITS.imageMaxBytes) {
        rejected.push(`${f.name}: max 3 MB`)
        return false
      }
      return true
    })
    if (rejected.length) setError(rejected.join(' · '))
    setFiles(prev => [...prev, ...allowed].slice(0, 5))
  }

  function setWhitepaperFile(file: File | null) {
    setError(null)
    if (!file) { setWhitepaper(null); return }
    if (file.type !== 'application/pdf') {
      setError(`${file.name}: must be PDF`)
      return
    }
    if (file.size > LIMITS.pdfMaxBytes) {
      setError(`${file.name}: max 5 MB`)
      return
    }
    setWhitepaper(file)
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (website.trim()) { setLoading(false); return } // honeypot tripped
    const elapsed = (Date.now() - formLoadedAtRef.current) / 1000
    if (elapsed < MIN_FORM_DWELL_SECONDS) {
      setError('Please take a moment before submitting')
      setLoading(false)
      return
    }

    if (title.trim().length < LIMITS.ideaTitle.min || title.trim().length > LIMITS.ideaTitle.max) {
      setError(`Title must be ${LIMITS.ideaTitle.min}-${LIMITS.ideaTitle.max} characters`)
      setLoading(false)
      return
    }
    if (description.trim().length < LIMITS.ideaDescription.min || description.trim().length > LIMITS.ideaDescription.max) {
      setError(`Description must be ${LIMITS.ideaDescription.min}-${LIMITS.ideaDescription.max} characters`)
      setLoading(false)
      return
    }
    if (youtubeUrl.trim() && !extractYouTubeId(youtubeUrl)) {
      setError('Invalid YouTube URL')
      setLoading(false)
      return
    }

    const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean)

    // Upload media files via server-side route (storage RLS denies direct client uploads).
    const mediaUrls: string[] = []
    async function uploadVia(file: File, kind: 'media' | 'whitepaper'): Promise<string | null> {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('kind', kind)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        return null
      }
      return data.url
    }

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`${t('submit.uploading')} ${i + 1}/${files.length}...`)
      const url = await uploadVia(files[i], 'media')
      if (!url) { setLoading(false); setUploadProgress(''); return }
      mediaUrls.push(url)
    }

    let whitepaperUrl = ''
    if (whitepaper) {
      setUploadProgress(t('submit.uploadingWp'))
      const url = await uploadVia(whitepaper, 'whitepaper')
      if (!url) { setLoading(false); setUploadProgress(''); return }
      whitepaperUrl = url
    }

    setUploadProgress(t('submit.submitting'))

    const body: Record<string, unknown> = {
      title, description, category, tags: tagList, media_urls: mediaUrls, language: 'en',
      website,
      form_loaded_at: formLoadedAtRef.current,
    }
    if (whitepaperUrl) body.whitepaper_url = whitepaperUrl
    if (youtubeUrl.trim()) body.youtube_url = youtubeUrl.trim()

    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? t('submit.error'))
      setLoading(false)
      setUploadProgress('')
      return
    }

    router.push(`/idea/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">{t('submit.label')}</span>
          <h1
            className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            {t('submit.title')}
          </h1>
          <p className="font-body text-on-surface-variant text-lg border-l border-primary/30 pl-6">
            {t('submit.subtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            aria-hidden="true"
          />

          <div className="group">
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant group-focus-within:text-primary transition-colors flex items-center justify-between mb-2">
              <span>{t('submit.fieldTitle')}</span>
              <span className="text-neutral-700 normal-case tracking-normal">{title.length}/{LIMITS.ideaTitle.max}</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('submit.fieldTitlePlaceholder')}
              required
              maxLength={LIMITS.ideaTitle.max}
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface text-xl font-headline italic focus:ring-0 focus:outline-none focus:border-primary transition-all placeholder-on-surface-variant/30"
              style={{ borderBottomWidth: 1, borderRadius: 0 }}
            />
          </div>

          <div className="group">
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant group-focus-within:text-primary transition-colors flex items-center justify-between mb-2">
              <span>{t('submit.fieldDesc')}</span>
              <span className="text-neutral-700 normal-case tracking-normal">{description.length}/{LIMITS.ideaDescription.max}</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('submit.fieldDescPlaceholder')}
              required
              rows={5}
              maxLength={LIMITS.ideaDescription.max}
              className="w-full bg-surface-container-low border border-outline-variant/30 py-4 px-5 text-on-surface font-body focus:ring-0 focus:outline-none focus:border-primary transition-all placeholder-on-surface-variant/30 resize-vertical"
              style={{ borderRadius: 0 }}
            />
          </div>

          <div className="group">
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant group-focus-within:text-primary transition-colors block mb-2">
              {t('submit.fieldCategory')}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 py-4 px-5 text-on-surface font-body focus:ring-0 focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{t(`catName.${c.value}` as TranslationKey)}</option>)}
            </select>
          </div>

          <div className="group">
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant group-focus-within:text-primary transition-colors block mb-2">
              {t('submit.fieldTags')} <span className="opacity-50">{t('submit.fieldTagsHint')}</span>
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="ai, saas, b2b"
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface font-body focus:ring-0 focus:outline-none focus:border-primary transition-all placeholder-on-surface-variant/30"
              style={{ borderBottomWidth: 1, borderRadius: 0 }}
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-4">
              {t('submit.fieldMedia')} <span className="opacity-50">{t('submit.fieldMediaHint')}</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={e => addFiles(e.target.files)}
              className="hidden"
            />
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="relative aspect-square bg-surface-container-low border border-outline-variant/30 flex items-center justify-center overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                  </button>
                </div>
              ))}
              {files.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-surface-container-lowest border-2 border-dashed border-white/10 hover:border-primary flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-neutral-600 text-2xl">add_photo_alternate</span>
                  <span className="text-[9px] text-neutral-600 font-label uppercase">{t('submit.addMedia')}</span>
                </button>
              )}
            </div>
          </div>

          {/* YouTube URL */}
          <div className="group">
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant group-focus-within:text-primary transition-colors block mb-2">
              YouTube link <span className="opacity-50">(optional — embed a demo video)</span>
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 text-on-surface font-body focus:ring-0 focus:outline-none focus:border-primary transition-all placeholder-on-surface-variant/30"
              style={{ borderBottomWidth: 1, borderRadius: 0 }}
            />
          </div>

          {/* Whitepaper Upload */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-4">
              {t('submit.fieldWhitepaper')} <span className="opacity-50">{t('submit.fieldWhitepaperHint')}</span>
            </label>
            <input
              ref={wpInputRef}
              type="file"
              accept=".pdf"
              onChange={e => setWhitepaperFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {whitepaper ? (
              <div className="flex items-center gap-4 bg-surface-container-low border border-outline-variant/30 px-5 py-4">
                <span className="material-symbols-outlined text-primary">description</span>
                <span className="font-body text-on-surface text-sm flex-1 truncate">{whitepaper.name}</span>
                <button
                  type="button"
                  onClick={() => setWhitepaper(null)}
                  className="text-neutral-500 hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => wpInputRef.current?.click()}
                className="w-full bg-surface-container-lowest border-2 border-dashed border-white/10 hover:border-primary py-6 flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-neutral-600">upload_file</span>
                <span className="text-xs text-neutral-600 font-label uppercase tracking-widest">{t('submit.uploadPdf')}</span>
              </button>
            )}
          </div>

          {error && (
            <p className="font-label text-xs text-error uppercase tracking-wide">{error}</p>
          )}

          {uploadProgress && (
            <p className="font-label text-xs text-primary uppercase tracking-wide">{uploadProgress}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-container text-black font-label font-black uppercase tracking-[0.2em] py-6 transition-all active:scale-[0.98] transform flex items-center justify-center gap-3"
            style={{ borderRadius: 0 }}
          >
            <span>{loading ? '...' : t('submit.submitBtn')}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  )
}
