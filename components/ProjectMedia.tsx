'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from '@/components/LanguageProvider'
import { extractYouTubeId } from '@/lib/youtube'

export type MediaType = {
  type: 'image' | 'video' | 'youtube'
  url: string
}

interface Props {
  media: MediaType[]
}

export default function ProjectMedia({ media }: Props) {
  const { t } = useLocale()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const hasMedia = media && media.length > 0
  const total = media?.length ?? 0

  const prev = useCallback(() => setCurrentIndex(i => (i === 0 ? total - 1 : i - 1)), [total])
  const next = useCallback(() => setCurrentIndex(i => (i === total - 1 ? 0 : i + 1)), [total])

  // Lightbox keyboard nav
  useEffect(() => {
    if (!lightbox) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(false)
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [lightbox, prev, next])

  if (!hasMedia) return null

  const currentMedia = media[currentIndex]
  const hasMultiple = total > 1
  const canExpand = currentMedia.type === 'image'

  return (
    <>
      <section className="w-full aspect-video md:h-[600px] mb-20 bg-black border border-[#262626] relative group overflow-hidden flex items-center justify-center">
        {/* Media Rendering — letterbox with object-contain */}
        {currentMedia.type === 'youtube' ? (
          (() => {
            const id = extractYouTubeId(currentMedia.url)
            return id ? (
              <iframe
                key={id}
                src={`https://www.youtube-nocookie.com/embed/${id}`}
                title="YouTube video"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                allowFullScreen
                className="absolute inset-0 w-full h-full z-20"
              />
            ) : null
          })()
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentMedia.url}
            alt="Project Media"
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {/* Video play overlay */}
        {currentMedia.type === 'video' && (
          <div className="relative z-20 flex flex-col items-center gap-4 pointer-events-none">
            <div className="w-20 h-20 bg-[#f3ffca] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(243,255,202,0.3)]">
              <span className="material-symbols-outlined text-[40px] text-[#3a4a00]">play_arrow</span>
            </div>
            <span className="font-label text-xs font-bold text-white uppercase tracking-[0.3em] bg-black/40 px-4 py-2 backdrop-blur-md rounded-full">
              {t('media.playDemo')}
            </span>
          </div>
        )}

        {/* Top Left Label */}
        <div className="absolute top-6 left-6 z-20 flex gap-2">
          <span className="bg-[#262626]/80 text-[#adaaaa] text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-label backdrop-blur-md border border-white/5">
            {currentMedia.type === 'youtube' ? 'Video' : currentMedia.type === 'video' ? t('media.video') : t('media.image')}
          </span>
          {hasMultiple && (
            <span className="bg-black/60 text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-label backdrop-blur-md border border-white/5">
              {currentIndex + 1} / {total}
            </span>
          )}
        </div>

        {/* Top Right — Expand button (images only) */}
        {canExpand && (
          <button
            onClick={() => setLightbox(true)}
            aria-label="View full size"
            className="absolute top-6 right-6 z-30 w-10 h-10 bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-[#f3ffca] hover:text-black hover:border-transparent transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>open_in_full</span>
          </button>
        )}

        {/* Carousel Controls */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-[#f3ffca] hover:text-black hover:border-transparent transition-all outline-none opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-[#f3ffca] hover:text-black hover:border-transparent transition-all outline-none opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
              {media.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`w-2 h-2 rounded-full transition-all outline-none ${idx === currentIndex ? 'bg-[#f3ffca] w-6' : 'bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            aria-label="Close"
            className="absolute top-6 right-6 w-12 h-12 bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-[#f3ffca] hover:text-black hover:border-transparent transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {currentMedia.type === 'image' && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentMedia.url}
              alt=""
              onClick={e => e.stopPropagation()}
              className="max-w-[95vw] max-h-[90vh] object-contain"
            />
          )}

          {hasMultiple && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                aria-label="Previous"
                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/10 bg-black/60 flex items-center justify-center text-white hover:bg-[#f3ffca] hover:text-black hover:border-transparent transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                aria-label="Next"
                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/10 bg-black/60 flex items-center justify-center text-white hover:bg-[#f3ffca] hover:text-black hover:border-transparent transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-label text-xs uppercase tracking-widest text-neutral-500">
                {currentIndex + 1} / {total}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
