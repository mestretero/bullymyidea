'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Idea } from '@/types'
import { getCategoryMeta } from '@/lib/categories'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useLocale } from '@/components/LanguageProvider'
import type { TranslationKey } from '@/lib/i18n'
import { estimateBullyScore, formatScore } from '@/lib/bully-score'

interface Props { idea: Idea }

function getIntensityWidth(feedbackCount: number): number {
  if (feedbackCount === 0) return 0
  return Math.min(95, 20 + feedbackCount * 9)
}

function getIntensityKey(feedbackCount: number): { key: TranslationKey; color: string } {
  if (feedbackCount === 0) return { key: 'ideaCard.new', color: 'var(--primary)' }
  if (feedbackCount >= 8) return { key: 'ideaCard.savage', color: 'var(--error)' }
  if (feedbackCount >= 5) return { key: 'ideaCard.harsh', color: '#f3ffca' }
  if (feedbackCount >= 3) return { key: 'ideaCard.moderate', color: '#f6ad55' }
  return { key: 'ideaCard.mild', color: 'var(--on-surface-variant)' }
}

function pickThumbnail(idea: Idea): string | null {
  if (!idea.media_urls?.length) return null
  return idea.media_urls.find(u => !u.endsWith('.mp4') && !u.endsWith('.webm')) ?? null
}

export default function IdeaCard({ idea }: Props) {
  const router = useRouter()
  const { locale, t } = useLocale()
  const cat = getCategoryMeta(idea.category)
  const timeAgo = formatDistanceToNow(new Date(idea.created_at), { addSuffix: true, locale: enUS })
  const count = idea.feedback_count ?? 0
  const scoreNum = estimateBullyScore(count)
  const score = formatScore(scoreNum)
  const intensityW = getIntensityWidth(count)
  const intensityData = getIntensityKey(count)
  const intensity = { label: t(intensityData.key), color: intensityData.color }
  const isHighScore = scoreNum >= 7
  const thumb = pickThumbnail(idea)

  return (
    <Link href={`/idea/${idea.id}`} className="no-underline block">
      <div
        className="idea-card bg-surface-container-low flex flex-col h-full overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-black overflow-hidden">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-highest">
              <span
                className="font-headline italic font-black uppercase select-none whitespace-nowrap"
                style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: cat.color, opacity: 0.15 }}
              >
                {t(`catName.${cat.value}` as TranslationKey)}
              </span>
            </div>
          )}
          <span
            className="absolute top-3 right-3 font-label text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 backdrop-blur-md bg-black/40"
            style={{ border: `1px solid ${intensity.color}`, color: intensity.color }}
          >
            {intensity.label}
          </span>
        </div>

        {/* Category stripe */}
        <div className="px-6 pt-5 pb-0 flex items-start justify-between gap-2">
          <span
            className="font-label text-[9px] uppercase tracking-[0.18em] font-bold px-2 py-1"
            style={{ background: 'var(--surface-highest)', color: cat.color }}
          >
            {t(`catName.${cat.value}` as TranslationKey)}
          </span>
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-6 flex flex-col flex-grow">
          <h3
            className="font-headline font-black uppercase tracking-tight mb-3 leading-tight"
            style={{ fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', color: '#fff' }}
          >
            {idea.title}
          </h3>
          <p
            className="font-body text-on-surface-variant text-sm mb-6 flex-grow"
            style={{
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {idea.description}
          </p>

          {/* Tags — clickable. <a> can't nest inside the card's outer <Link>,
              so use a focusable span and route via JS. */}
          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {idea.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  role="link"
                  tabIndex={0}
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/tag/${encodeURIComponent(tag)}`)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      router.push(`/tag/${encodeURIComponent(tag)}`)
                    }
                  }}
                  className="font-label text-[9px] uppercase tracking-widest px-2 py-0.5 cursor-pointer hover:text-primary transition-colors relative z-10"
                  style={{ background: 'var(--surface-highest)', color: 'var(--on-surface-variant)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            className="pt-5 flex items-end justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div>
              <div className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">
                {t('ideaCard.bullyScore')}
              </div>
              <div
                className="font-headline italic font-bold"
                style={{ fontSize: '1.6rem', color: isHighScore ? 'var(--error)' : 'var(--primary)', lineHeight: 1 }}
              >
                {score}
              </div>
            </div>
            <div className="text-right">
              <div className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">
                {count} {t('ideaCard.comments')} · {timeAgo}
              </div>
              <div className="w-24 h-1.5 bg-surface-highest overflow-hidden flex">
                <div
                  style={{
                    width: `${intensityW}%`,
                    height: '100%',
                    background: intensity.color,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
