'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Idea, Feedback } from '@/types'
import { useLocale } from '@/components/LanguageProvider'
import type { TranslationKey } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { LIMITS } from '@/lib/limits'
import { estimateBullyScore, formatScore } from '@/lib/bully-score'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import DataExportButton from '@/components/DataExportButton'
import AchievementShelf from '@/components/AchievementShelf'
import ArchivedIdeaCard from '@/components/ArchivedIdeaCard'
import { reputationTier, nextReputationTier, type UserStats } from '@/lib/achievements'

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface Profile { id: string; username: string | null; bio?: string; avatar_url?: string | null; created_at: string }

interface RankInfo { rank: number; total: number; score: number }

interface Props {
  profile: Profile
  ideas: Idea[]
  archivedIdeas?: Idea[]
  feedbacksGiven: Feedback[]
  avgBullyScore: string
  isOwner: boolean
  stats: UserStats
  rankInfo: RankInfo
}

export default function ProfileView({ profile, ideas, archivedIdeas = [], feedbacksGiven, avgBullyScore, isOwner, stats, rankInfo }: Props) {
  const { t } = useLocale()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ideas' | 'bullies' | 'archived'>('ideas')
  const PAGE_SIZE = 12
  const [editing, setEditing] = useState(false)
  const [showAllIdeas, setShowAllIdeas] = useState(false)
  const [showAllBullies, setShowAllBullies] = useState(false)
  const [username, setUsername] = useState(profile.username ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function uploadAvatar(file: File) {
    setEditError(null)
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setEditError('Avatar must be JPG, PNG or WebP')
      return
    }
    if (file.size > LIMITS.avatarMaxBytes) {
      setEditError('Avatar max 1 MB')
      return
    }
    setAvatarUploading(true)
    const fd = new FormData()
    fd.set('file', file)
    fd.set('kind', 'avatar')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    setAvatarUploading(false)
    if (!res.ok) {
      setEditError(data.error ?? 'Upload failed')
      return
    }
    setAvatarUrl(data.url)
  }

  async function saveProfile() {
    setSaving(true)
    setEditError(null)
    const res = await fetch(`/api/profiles/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, bio, avatar_url: avatarUrl }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setEditError(data.error); return }
    setEditing(false)
    router.refresh()
  }

  return (
    <div className="pt-32 pb-24 px-6 md:px-20 max-w-7xl mx-auto">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row items-start md:items-end gap-10 mb-24">
        {/* Avatar */}
        <div className="w-48 h-48 md:w-64 md:h-64 bg-surface-container-highest relative overflow-hidden flex-shrink-0 flex items-center justify-center group">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant opacity-20" style={{ fontSize: 140 }}>account_circle</span>
          )}
          <div className="absolute inset-0 border border-primary/20 pointer-events-none" />
          {editing && isOwner && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }}
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-label uppercase text-xs tracking-widest"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>photo_camera</span>
                {avatarUploading ? 'Uploading…' : 'Change'}
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow space-y-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="font-label text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">Username</label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={30}
                  className="bg-transparent border-b border-primary/40 focus:border-primary outline-none text-white font-headline italic font-black text-4xl w-full pb-1"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="font-label text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">Bio <span className="text-neutral-700">({bio.length}/200)</span></label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="w-full bg-black/30 border border-[#494847]/20 p-3 text-sm font-body text-[#e2e2e2] placeholder:text-neutral-700 focus:border-primary focus:ring-0 outline-none resize-none"
                  placeholder="A sentence about yourself..."
                />
              </div>
              {editError && <p className="text-xs text-[#ff7351]">{editError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-primary text-black font-label font-bold py-2 px-6 uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditError(null); setUsername(profile.username ?? ''); setBio(profile.bio ?? ''); setAvatarUrl(profile.avatar_url ?? '') }}
                  className="font-label text-xs uppercase tracking-widest text-neutral-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <span className="font-label uppercase text-primary text-xs tracking-[0.3em] block mb-2">{t('profile.entity')}</span>
              <h1 className="font-headline font-black italic tracking-tighter leading-none" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
                @{profile.username ?? 'anonymous'}
              </h1>
              {profile.bio && (
                <p className="font-body text-on-surface-variant text-base mt-3 max-w-xl">{profile.bio}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {(() => {
              const tier = reputationTier(stats)
              const next = nextReputationTier(stats)
              return (
                <div
                  className="bg-surface-container-high px-4 py-2 flex items-center gap-3"
                  title={next ? `${next.remaining} more activity to reach ${next.tier.label}` : 'Top tier reached'}
                >
                  <span className="text-primary font-label text-[10px] uppercase tracking-widest">{t('profile.repRank')}</span>
                  <span className="font-headline italic font-bold text-xl text-white">{tier.label}</span>
                </div>
              )
            })()}
            <div
              className="bg-surface-container-high px-4 py-2 flex items-center gap-3"
              title={`Activity score: ${rankInfo.score} · ${rankInfo.total} active users`}
            >
              <span className="text-primary font-label text-[10px] uppercase tracking-widest">{t('profile.globalRank')}</span>
              <span className="font-headline italic font-bold text-xl text-white">
                #{String(rankInfo.rank).padStart(3, '0')}
                {rankInfo.total > 0 && (
                  <span className="font-label text-[10px] text-neutral-500 ml-1">/ {rankInfo.total}</span>
                )}
              </span>
            </div>
            {isOwner && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors px-4 py-2 border border-white/10 hover:border-primary/30"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                Edit profile
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-24">
        <div className="bg-surface-container-low p-10 flex flex-col justify-between border-l border-primary/10">
          <span className="text-neutral-500 font-label text-[10px] uppercase tracking-[0.2em]">{t('profile.critiquesEndured')}</span>
          <div className="mt-4">
            <span className="text-5xl font-headline font-black italic">{ideas.length}</span>
            <p className="text-xs text-neutral-500 mt-2 font-label uppercase">{t('profile.ideasSacrificed')}</p>
          </div>
        </div>
        <div className="bg-surface-container-low p-10 flex flex-col justify-between border-l border-primary/10">
          <span className="text-neutral-500 font-label text-[10px] uppercase tracking-[0.2em]">{t('profile.avgScore')}</span>
          <div className="mt-4">
            <span className="text-5xl font-headline font-black italic text-primary">{avgBullyScore}</span>
            <p className="text-xs text-neutral-500 mt-2 font-label uppercase">{t('profile.efficiencyRating')}</p>
          </div>
        </div>
        <div className="bg-surface-container-low p-10 flex flex-col justify-between border-l border-primary/10">
          <span className="text-neutral-500 font-label text-[10px] uppercase tracking-[0.2em]">{t('profile.soulsCrushed')}</span>
          <div className="mt-4">
            <span className="text-5xl font-headline font-black italic">{feedbacksGiven.length}</span>
            <p className="text-xs text-neutral-500 mt-2 font-label uppercase">{t('profile.totalCritiques')}</p>
          </div>
        </div>
      </section>

      {/* ── ACHIEVEMENTS ────────────────────────────────────── */}
      <AchievementShelf stats={stats} isOwner={isOwner} ownerId={profile.id} />

      {/* ── TABS ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-12 mb-12 border-b border-white/5">
          <button
            className={`font-headline text-2xl italic font-bold pb-4 transition-all border-b-2 ${
              activeTab === 'ideas' ? 'border-primary text-on-surface' : 'border-transparent text-neutral-600 hover:text-white'
            }`}
            onClick={() => setActiveTab('ideas')}
          >
            {t('profile.myIdeas')}
          </button>
          <button
            className={`font-headline text-2xl italic font-bold pb-4 transition-all border-b-2 ${
              activeTab === 'bullies' ? 'border-primary text-on-surface' : 'border-transparent text-neutral-600 hover:text-white'
            }`}
            onClick={() => setActiveTab('bullies')}
          >
            {t('profile.myBullies')}
          </button>
          {isOwner && archivedIdeas.length > 0 && (
            <button
              className={`font-headline text-2xl italic font-bold pb-4 transition-all border-b-2 ${
                activeTab === 'archived' ? 'border-primary text-on-surface' : 'border-transparent text-neutral-600 hover:text-white'
              }`}
              onClick={() => setActiveTab('archived')}
            >
              Archived <span className="font-label text-xs text-neutral-600 ml-1 align-middle">({archivedIdeas.length})</span>
            </button>
          )}
        </div>

        {activeTab === 'ideas' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
              {ideas.length === 0 && !isOwner && (
                <p className="font-label text-xs uppercase tracking-widest text-neutral-600 col-span-3 py-20 text-center">
                  No ideas submitted yet.
                </p>
              )}
              {(showAllIdeas ? ideas : ideas.slice(0, PAGE_SIZE)).map(idea => (
                <Link href={`/idea/${idea.id}`} key={idea.id} className="no-underline h-full">
                  <ProfileIdeaCard idea={idea} />
                </Link>
              ))}
              {isOwner && (
                <Link href="/submit" className="no-underline h-full">
                  <div className="bg-surface-container-lowest border-2 border-dashed border-white/5 p-8 flex items-center justify-center group cursor-pointer hover:border-primary transition-colors h-full">
                    <div className="text-center space-y-4">
                      <span className="material-symbols-outlined text-neutral-700 group-hover:text-primary transition-colors" style={{ fontSize: 40 }}>add_circle</span>
                      <p className="font-label uppercase text-xs tracking-widest text-neutral-600 group-hover:text-neutral-300">{t('profile.addIdea')}</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
            {ideas.length > PAGE_SIZE && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setShowAllIdeas(s => !s)}
                  className="font-label font-bold uppercase tracking-[0.25em] text-xs px-12 py-4 text-on-surface hover:bg-on-surface hover:text-surface transition-all duration-300"
                  style={{ border: '1px solid var(--outline-variant)' }}
                >
                  {showAllIdeas ? 'Show less' : `Show all (${ideas.length})`}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'bullies' && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
            {(showAllBullies ? feedbacksGiven : feedbacksGiven.slice(0, PAGE_SIZE)).map(fb => (
              <Link href={`/idea/${fb.idea_id}`} key={fb.id} className="no-underline h-full">
                <ProfileBullyCard feedback={fb} />
              </Link>
            ))}
            {feedbacksGiven.length === 0 && (
              <p className="font-label text-xs uppercase tracking-widest text-neutral-600 col-span-3 py-20 text-center">
                {t('profile.noBullies')}
              </p>
            )}
          </div>
          {feedbacksGiven.length > PAGE_SIZE && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => setShowAllBullies(s => !s)}
                className="font-label font-bold uppercase tracking-[0.25em] text-xs px-12 py-4 text-on-surface hover:bg-on-surface hover:text-surface transition-all duration-300"
                style={{ border: '1px solid var(--outline-variant)' }}
              >
                {showAllBullies ? 'Show less' : `Show all (${feedbacksGiven.length})`}
              </button>
            </div>
          )}
          </>
        )}

        {activeTab === 'archived' && isOwner && (
          <>
            {archivedIdeas.length === 0 ? (
              <p className="font-label text-xs uppercase tracking-widest text-neutral-600 col-span-3 py-20 text-center">
                No archived ideas.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                {archivedIdeas.map(idea => (
                  <ArchivedIdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            )}
            <p className="font-label text-[10px] uppercase tracking-widest text-neutral-600 mt-8">
              Archived ideas are hidden from the public feed and search. Restore one to make it public again.
            </p>
          </>
        )}
      </section>

      {isOwner && (
        <section className="mt-32 pt-12 border-t border-white/5">
          <header className="mb-10">
            <span className="font-label text-primary uppercase text-[10px] tracking-[0.3em] block mb-2">Settings</span>
            <h2 className="font-headline italic font-bold text-3xl text-on-surface">Account.</h2>
          </header>

          {/* Two-up grid for Security + Data; Danger zone is full-width below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1">
            {/* Security */}
            <Link
              href="/profile/me/security"
              className="group relative bg-surface-container-low hover:bg-surface-container-high border border-white/5 hover:border-primary/30 transition-all no-underline p-7 flex flex-col gap-5"
            >
              <div className="flex items-start justify-between gap-4">
                <span aria-hidden="true" className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>shield</span>
                <span className="material-symbols-outlined text-neutral-600 group-hover:text-primary transition-colors" aria-hidden="true" style={{ fontSize: 18 }}>arrow_outward</span>
              </div>
              <div>
                <h3 className="font-headline italic text-2xl text-on-surface group-hover:text-primary transition-colors mb-1">Two-factor auth</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  Extra step at sign-in. Use Google Authenticator, Authy, 1Password, or any TOTP app.
                </p>
              </div>
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-neutral-500 mt-auto">
                Manage →
              </span>
            </Link>

            {/* Your data */}
            <div className="bg-surface-container-low border border-white/5 p-7 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <span aria-hidden="true" className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>folder_zip</span>
              </div>
              <div>
                <h3 className="font-headline italic text-2xl text-on-surface mb-1">Your data</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  Download a JSON archive with every record we hold — profile, ideas, critiques, votes,
                  bookmarks, notifications.
                </p>
              </div>
              <div className="mt-auto">
                <DataExportButton />
              </div>
            </div>
          </div>

          {/* Danger zone — header row + button row.
              Button collapsed sits top-right (action front-and-centre);
              when expanded, the form takes the full width below. */}
          <div className="bg-error/5 border-2 border-error/30 p-7 mt-12">
            <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
              <div className="flex items-start gap-4 flex-1">
                <span aria-hidden="true" className="material-symbols-outlined text-error mt-1 flex-shrink-0" style={{ fontSize: 28 }}>warning</span>
                <div className="flex-1">
                  <span className="font-label text-[10px] uppercase tracking-[0.3em] text-error/80 block mb-1">Danger zone</span>
                  <h3 className="font-headline italic text-xl text-error mb-1">Delete account</h3>
                  <p className="font-body text-sm text-on-surface-variant max-w-xl">
                    Permanently removes your account, ideas, critiques, votes, bookmarks. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="md:flex-shrink-0">
                <DeleteAccountButton />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function ProfileIdeaCard({ idea }: { idea: Idea }) {
  const { t } = useLocale()
  const count = idea.feedback_count ?? 0
  const score = formatScore(estimateBullyScore(count))
  const isHot = count >= 6
  const thumb = idea.media_urls?.find(u => !u.endsWith('.mp4') && !u.endsWith('.webm')) ?? null

  return (
    <div className="bg-surface-container-low p-0 group overflow-hidden flex flex-col h-full">
      <div className="aspect-video bg-black overflow-hidden relative flex items-center justify-center flex-shrink-0">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span
            className="font-headline italic font-black text-on-surface-variant opacity-10 select-none uppercase"
            style={{ fontSize: '4rem' }}
          >
            {idea.category}
          </span>
        )}
        <div className={`absolute top-4 right-4 px-2 py-1 text-[10px] font-bold uppercase font-label backdrop-blur-md ${
          isHot ? 'bg-primary text-black' : 'bg-black/50 text-white border border-white/10'
        }`}>
          {isHot ? t('profile.criticalCondition') : t('profile.active')}
        </div>
      </div>
      <div className="p-8 flex flex-col flex-grow gap-4">
        <h3 className="font-headline text-xl font-bold italic text-white leading-tight line-clamp-2">{idea.title}</h3>
        <p className="text-neutral-400 text-sm font-light leading-relaxed line-clamp-3 flex-grow">{idea.description}</p>
        <div className="pt-4 flex items-center justify-between border-t border-white/5">
          <span className="font-headline italic font-bold text-primary text-2xl">{score}</span>
          <span className="text-[10px] font-label uppercase text-neutral-500 tracking-tighter">{count} {t('profile.bulliesActive')}</span>
        </div>
      </div>
    </div>
  )
}

function ProfileBullyCard({ feedback }: { feedback: Feedback }) {
  const { t } = useLocale()
  const preview = feedback.strengths || feedback.weaknesses || feedback.suggestions || '—'
  return (
    <div className="bg-surface-container-low p-8 flex flex-col gap-4 group hover:bg-surface-container-high transition-colors h-full">
      <div className="font-label text-[10px] uppercase tracking-widest text-primary">{t('profile.critique')}</div>
      <p className="font-headline italic text-lg font-bold text-white leading-tight line-clamp-2">{preview}</p>
      {feedback.weaknesses && feedback.strengths && (
        <p className="text-neutral-400 text-sm font-light leading-relaxed line-clamp-3 flex-grow">{feedback.weaknesses}</p>
      )}
      <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-label uppercase text-neutral-600 tracking-wider">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_upward</span>
        {feedback.vote_counts?.up ?? 0} {t('profile.upvotes')}
      </div>
    </div>
  )
}
