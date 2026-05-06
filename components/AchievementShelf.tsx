'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { unlockedAchievements, nextAchievement, ACHIEVEMENTS, TIER_COLORS, type UserStats } from '@/lib/achievements'

interface Props {
  stats: UserStats
  /** Profile owner — only celebrate unlocks when viewing your own profile. */
  isOwner?: boolean
  /** Stable key for the localStorage state — typically the profile user_id. */
  ownerId?: string
}

const SEEN_KEY = (id: string) => `bmi-ach-seen:${id}`

export default function AchievementShelf({ stats, isOwner, ownerId }: Props) {
  const [showAll, setShowAll] = useState(false)
  const unlocked = unlockedAchievements(stats)
  const next = nextAchievement(stats)
  const list = showAll ? ACHIEVEMENTS : unlocked

  // Celebrate any newly unlocked achievement once, on this device.
  useEffect(() => {
    if (!isOwner || !ownerId) return
    let raw: string | null
    try {
      raw = localStorage.getItem(SEEN_KEY(ownerId))
    } catch {
      return
    }

    // First run on this device: seed with currently-unlocked IDs and skip
    // toasts — we only celebrate achievements unlocked AFTER this point,
    // not the user's pre-existing badges.
    if (raw === null) {
      try {
        localStorage.setItem(SEEN_KEY(ownerId), JSON.stringify(unlocked.map(a => a.id)))
      } catch {}
      return
    }

    let seen: Set<string>
    try {
      seen = new Set(JSON.parse(raw) as string[])
    } catch {
      return
    }
    const fresh = unlocked.filter(a => !seen.has(a.id))
    if (!fresh.length) return

    fresh.forEach((a, i) => {
      setTimeout(() => {
        toast.success(`Achievement unlocked: ${a.label}`, {
          description: a.description,
          duration: 6000,
        })
      }, i * 600)
    })

    const nextIds = Array.from(seen).concat(fresh.map(a => a.id))
    try { localStorage.setItem(SEEN_KEY(ownerId), JSON.stringify(nextIds)) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, ownerId, unlocked.map(a => a.id).join(',')])


  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <span className="font-label text-[11px] uppercase tracking-[0.3em] text-on-surface-variant">
          Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
        </span>
        <button
          onClick={() => setShowAll(s => !s)}
          className="font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary transition-colors"
        >
          {showAll ? 'Hide locked' : 'Show all'}
        </button>
      </div>

      {unlocked.length === 0 && !showAll && (
        <p className="font-body text-sm text-on-surface-variant py-6">
          No badges yet. Critique an idea to unlock your first achievement.
        </p>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {list.map(a => {
            const isUnlocked = stats[a.metric] >= a.threshold
            const progress = Math.min(100, (stats[a.metric] / a.threshold) * 100)
            return (
              <div
                key={a.id}
                title={`${a.label} — ${a.description}${isUnlocked ? '' : ` (${stats[a.metric]}/${a.threshold})`}`}
                className={`p-4 border transition-all ${isUnlocked ? 'border-white/10 bg-surface-container-low' : 'border-white/5 bg-surface-container-lowest opacity-50'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 24, color: isUnlocked ? TIER_COLORS[a.tier] : '#444' }}
                  >
                    {a.icon}
                  </span>
                  <span className="font-label text-[9px] uppercase tracking-widest" style={{ color: isUnlocked ? TIER_COLORS[a.tier] : '#666' }}>
                    {a.tier}
                  </span>
                </div>
                <p className="font-headline italic text-sm font-bold text-on-surface leading-tight mb-1">{a.label}</p>
                <p className="font-body text-[10px] text-on-surface-variant leading-tight line-clamp-2">{a.description}</p>
                {!isUnlocked && (
                  <div className="mt-3 h-[2px] bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {next && (
        <p className="mt-4 font-label text-[10px] uppercase tracking-widest text-neutral-500">
          Next: <span className="text-primary">{next.label}</span> — {stats[next.metric]}/{next.threshold}
        </p>
      )}
    </section>
  )
}
