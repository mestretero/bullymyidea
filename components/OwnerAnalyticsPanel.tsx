// Owner-only stats for an idea.
// Renders compact metrics: views, critiques, upvote/downvote breakdown, approval ratio.

interface Props {
  views: number
  totalReviews: number
  totalUpvotes: number
  allFeedbacks: Array<{ created_at?: string; votes?: { vote_type: string }[] }>
}

export default function OwnerAnalyticsPanel({ views, totalReviews, totalUpvotes, allFeedbacks }: Props) {
  let totalDownvotes = 0
  for (const fb of allFeedbacks) {
    for (const v of (fb.votes ?? [])) {
      if (v.vote_type === 'down') totalDownvotes++
    }
  }
  const totalVotes = totalUpvotes + totalDownvotes
  const approvalPct = totalVotes > 0 ? Math.round((totalUpvotes / totalVotes) * 100) : null

  return (
    <section className="mb-12 bg-surface-container-low border border-primary/20 px-6 py-5">
      <div className="flex items-center gap-3 mb-4">
        <span aria-hidden="true" className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>analytics</span>
        <span className="font-label text-[10px] uppercase tracking-[0.25em] text-primary">Founder analytics</span>
        <span className="font-label text-[10px] uppercase tracking-widest text-neutral-600 ml-auto">only you can see this</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        <Stat label="Views" value={views} />
        <Stat label="Critiques" value={totalReviews} accent />
        <Stat
          label="Critique votes"
          value={totalVotes}
          sub={totalVotes > 0 ? `↑ ${totalUpvotes}  ↓ ${totalDownvotes}` : 'no votes yet'}
        />
        <Stat
          label="Approval"
          value={approvalPct !== null ? `${approvalPct}%` : '—'}
          sub={approvalPct !== null
            ? approvalPct >= 70 ? 'community endorses critiques'
              : approvalPct >= 40 ? 'mixed reception'
              : 'critiques contested'
            : 'awaiting votes'}
        />
      </div>

      {totalReviews === 0 && views > 5 && (
        <p className="font-body text-xs text-on-surface-variant mt-4 italic">
          {views} people read your idea but no one has critiqued yet. Share it harder.
        </p>
      )}
    </section>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-surface-container-lowest p-4 border-l border-white/5">
      <span className="font-label text-[9px] uppercase tracking-widest text-neutral-500 block mb-1">{label}</span>
      <span className={`font-headline italic font-black text-2xl block leading-none ${accent ? 'text-primary' : 'text-on-surface'}`}>
        {typeof value === 'number' ? value.toLocaleString('en') : value}
      </span>
      {sub && <span className="font-label text-[9px] uppercase tracking-widest text-neutral-600 mt-1 block">{sub}</span>}
    </div>
  )
}
