import type { Idea } from '@/types'
import ArchiveButton from '@/components/ArchiveButton'

// Compact card for archived ideas — grayscale thumb, dimmed colors, Restore CTA.
export default function ArchivedIdeaCard({ idea }: { idea: Idea }) {
  const count = idea.feedback_count ?? 0
  const thumb = idea.media_urls?.find(u => !u.endsWith('.mp4') && !u.endsWith('.webm')) ?? null

  return (
    <div className="bg-surface-container-lowest border border-white/5 overflow-hidden flex flex-col h-full opacity-80 hover:opacity-100 transition-opacity">
      <div className="aspect-video bg-black overflow-hidden relative flex items-center justify-center flex-shrink-0">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover grayscale" />
        ) : (
          <span
            className="font-headline italic font-black text-on-surface-variant opacity-10 select-none uppercase"
            style={{ fontSize: '4rem' }}
          >
            {idea.category}
          </span>
        )}
        <div className="absolute top-4 right-4 px-2 py-1 text-[10px] font-bold uppercase font-label backdrop-blur-md bg-black/60 text-neutral-400 border border-white/10">
          Archived
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow gap-3">
        <h3 className="font-headline text-lg font-bold italic text-on-surface-variant leading-tight line-clamp-2">{idea.title}</h3>
        <p className="text-neutral-500 text-sm font-light leading-relaxed line-clamp-2 flex-grow">{idea.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="font-label text-[10px] uppercase tracking-widest text-neutral-600">{count} critiques</span>
          <ArchiveButton ideaId={idea.id} unarchive />
        </div>
      </div>
    </div>
  )
}
