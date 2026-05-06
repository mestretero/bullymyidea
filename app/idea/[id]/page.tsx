import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

import FeedbackList from '@/components/FeedbackList'
import FeedbackForm from '@/components/FeedbackForm'
import ProjectMedia, { MediaType } from '@/components/ProjectMedia'
import ArchiveButton from '@/components/ArchiveButton'
import DeleteButton from '@/components/DeleteButton'
import ShareButton from '@/components/ShareButton'
import BookmarkButton from '@/components/BookmarkButton'
import OwnerAnalyticsPanel from '@/components/OwnerAnalyticsPanel'
import { calculateBullyScore } from '@/lib/bully-score'
import type { Feedback } from '@/types'
import { getLocale } from '@/lib/get-locale'
import { t } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const PAGE_SIZE = 10

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createAdminClient()
  const { data: idea } = await supabase
    .from('ideas')
    .select('title, description, media_urls, status')
    .eq('id', params.id)
    .single()
  if (!idea || idea.status !== 'active') return { title: 'Idea not found' }
  const desc = (idea.description ?? '').slice(0, 160)
  const firstImage = (idea.media_urls ?? []).find((u: string) => !u.endsWith('.mp4') && !u.endsWith('.webm'))
  return {
    title: idea.title,
    description: desc,
    openGraph: {
      title: idea.title,
      description: desc,
      type: 'article',
      images: firstImage ? [firstImage] : undefined,
    },
    twitter: {
      card: firstImage ? 'summary_large_image' : 'summary',
      title: idea.title,
      description: desc,
      images: firstImage ? [firstImage] : undefined,
    },
  }
}

export default async function IdeaDetailPage({ params }: Props) {
  const locale = getLocale()
  const authClient = createServerClient()
  const { data: { user: currentUser } } = await authClient.auth.getUser()
  const supabase = createAdminClient()

  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !idea || idea.status === 'archived') return notFound()

  // Bump view counter — only for registered, non-author users, dedup'd per
  // user+ip+idea per 24h via rate_limits table. IP component thwarts one
  // attacker farming view_count across many fake accounts on the same machine.
  if (currentUser && !currentUser.is_anonymous && currentUser.id !== idea.user_id) {
    const [{ checkRateLimit }, { headers }, { getClientIp }] = await Promise.all([
      import('@/lib/rate-limit'),
      import('next/headers'),
      import('@/lib/get-client-ip'),
    ])
    const ip = getClientIp(headers())
    const allowed = await checkRateLimit(`view:${currentUser.id}:${ip}:${params.id}`, 'idea_view', 1)
    if (allowed) {
      supabase.rpc('increment_idea_view', { idea_uuid: params.id }).then(undefined, () => undefined)
    }
  }

  // Fetch feedbacks + votes (no profile join — fetch profiles separately to dodge FK ambiguity)
  const { data: feedbacksRaw } = await supabase
    .from('feedbacks')
    .select('*, votes(vote_type)')
    .eq('idea_id', params.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  const fbUserIds = Array.from(new Set((feedbacksRaw ?? []).map((fb: any) => fb.user_id).filter(Boolean)))
  const fbProfilesMap = new Map<string, { username: string | null; avatar_url: string | null }>()
  if (fbUserIds.length) {
    const { data: profs } = await supabase.from('profiles').select('id, username, avatar_url').in('id', fbUserIds)
    for (const p of (profs ?? []) as any[]) {
      fbProfilesMap.set(p.id, { username: p.username ?? null, avatar_url: p.avatar_url ?? null })
    }
  }

  const feedbacks: Feedback[] = (feedbacksRaw ?? []).map((fb: any) => {
    const votes: { vote_type: string }[] = fb.votes ?? []
    const profile = fb.user_id ? fbProfilesMap.get(fb.user_id) : null
    return {
      ...fb,
      votes: undefined,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      vote_counts: {
        up: votes.filter(v => v.vote_type === 'up').length,
        down: votes.filter(v => v.vote_type === 'down').length,
      },
    }
  })
  const hasMore = feedbacks.length > PAGE_SIZE
  const page = hasMore ? feedbacks.slice(0, PAGE_SIZE) : feedbacks

  // Fetch owner profile + their other ideas + total feedbacks received
  let ownerUsername = t('idea.anonymous', locale)
  let ownerProfile: { id: string; username: string | null; avatar_url: string | null; bio: string | null } | null = null
  let ownerStats = { ideaCount: 0, totalFeedbacks: 0 }
  let ownerOtherIdeas: { id: string; title: string; feedback_count: number }[] = []
  if (idea.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .eq('id', idea.user_id)
      .single()
    if (profile) {
      ownerProfile = profile
      if (profile.username) ownerUsername = `@${profile.username}`

      const { data: ownerIdeas } = await supabase
        .from('ideas')
        .select('id, title, feedbacks(count)')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      const ideaList = (ownerIdeas ?? []).map((it: any) => ({
        id: it.id,
        title: it.title,
        feedback_count: it.feedbacks?.[0]?.count ?? 0,
      }))
      ownerStats.ideaCount = ideaList.length
      ownerStats.totalFeedbacks = ideaList.reduce((s, it) => s + it.feedback_count, 0)
      ownerOtherIdeas = ideaList
        .filter(it => it.id !== params.id)
        .sort((a, b) => b.feedback_count - a.feedback_count)
        .slice(0, 3)
    }
  }

  // Fetch ALL feedbacks for this idea (for score + stats)
  const { data: allFeedbacks } = await supabase
    .from('feedbacks')
    .select('id, user_id, created_at, votes(vote_type)')
    .eq('idea_id', params.id)

  const totalReviews = allFeedbacks?.length ?? 0
  const isIdeaOwner = !!currentUser && idea.user_id === currentUser.id

  // Is current user bookmarking this idea?
  let isBookmarked = false
  if (currentUser) {
    const { data: bk } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('idea_id', params.id)
      .maybeSingle()
    isBookmarked = !!bk
  }
  const hasOwnFeedback = !!currentUser && !isIdeaOwner && (allFeedbacks ?? []).some((fb: any) => fb.user_id === currentUser.id)
  const totalUpvotes = (allFeedbacks ?? []).reduce((acc: number, fb: any) => {
    const votes: { vote_type: string }[] = fb.votes ?? []
    return acc + votes.filter(v => v.vote_type === 'up').length
  }, 0)

  // Bully Score — full formula: count + vote credibility + recency
  const feedbacksForScore = (allFeedbacks ?? []).map((fb: any) => {
    const votes: { vote_type: string }[] = fb.votes ?? []
    return {
      created_at: fb.created_at,
      vote_counts: {
        up: votes.filter(v => v.vote_type === 'up').length,
        down: votes.filter(v => v.vote_type === 'down').length,
      },
    }
  })
  const bullyScore = calculateBullyScore(feedbacksForScore)
  const survivalRate = bullyScore > 0
    ? Math.max(10, Math.round(100 - bullyScore * 8))
    : 100
  const bullyLevel = totalReviews === 0 ? '—' :
    bullyScore >= 8 ? t('idea.veryHigh', locale) : bullyScore >= 6 ? t('idea.high', locale) : bullyScore >= 4 ? t('idea.medium', locale) : t('idea.low', locale)
  const barWidth = totalReviews > 0 ? Math.min(95, 20 + totalReviews * 9) : 0

  // Top Bullies — users with most feedbacks on this idea
  const bullyMap = new Map<string, number>()
  for (const fb of (allFeedbacks ?? [])) {
    if (fb.user_id) bullyMap.set(fb.user_id, (bullyMap.get(fb.user_id) ?? 0) + 1)
  }
  const topBullyIds = Array.from(bullyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0])

  let topBullies: { username: string; count: number }[] = []
  if (topBullyIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', topBullyIds)
    topBullies = topBullyIds.map(uid => {
      const prof = (profiles ?? []).find((p: any) => p.id === uid)
      return { username: prof?.username ?? t('idea.anonymous', locale), count: bullyMap.get(uid) ?? 0 }
    })
  }

  // Media from idea (YouTube embed first if present, then images)
  const mediaUrls: string[] = idea.media_urls ?? []
  const media: MediaType[] = [
    ...(idea.youtube_url ? [{ type: 'youtube' as const, url: idea.youtube_url }] : []),
    ...mediaUrls.map(url => ({
      type: (url.endsWith('.mp4') || url.endsWith('.webm')) ? 'video' as const : 'image' as const,
      url,
    })),
  ]



  // ── SEO: JSON-LD structured data for rich Google results ──────────────
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bullymyidea.com'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: idea.title,
    articleBody: idea.description,
    url: `${SITE_URL}/idea/${idea.id}`,
    datePublished: idea.created_at,
    inLanguage: 'en',
    author: ownerProfile?.username
      ? { '@type': 'Person', name: `@${ownerProfile.username}`, url: `${SITE_URL}/profile/${ownerProfile.id}` }
      : { '@type': 'Person', name: 'anonymous' },
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: totalReviews },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: totalUpvotes },
    ],
    image: mediaUrls.find(u => !u.endsWith('.mp4') && !u.endsWith('.webm')) ?? undefined,
    keywords: idea.tags?.join(', ') ?? '',
    about: idea.category,
    commentCount: totalReviews,
    comment: page.slice(0, 5).map((fb: any) => ({
      '@type': 'Comment',
      text: [fb.strengths, fb.weaknesses, fb.suggestions].filter(Boolean).join(' · ').slice(0, 280),
      datePublished: fb.created_at,
      author: fb.username
        ? { '@type': 'Person', name: `@${fb.username}` }
        : { '@type': 'Person', name: 'anonymous' },
    })),
  }

  // Read CSP nonce set by middleware so this inline script passes the prod CSP.
  const { headers: nextHeaders } = await import('next/headers')
  const nonce = nextHeaders().get('x-nonce') ?? undefined

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        // Escape `<` so a malicious title containing `</script>` can't break out.
        // JSON.stringify does NOT escape `</script>` by itself.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <main className="pt-32 pb-20 px-6 md:px-10 max-w-7xl mx-auto">
        {media.length > 0 && <ProjectMedia media={media} />}

        {/* Hero Section */}
        <section className="mb-20 relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#262626] text-[#adaaaa] text-[10px] uppercase tracking-[0.2em] px-3 py-1 font-label">
              {t(`catName.${idea.category}` as TranslationKey, locale)}
            </span>
            <span className="w-12 h-[1px] bg-[#494847]/30" />
            <span className="text-primary text-[10px] uppercase tracking-[0.2em] font-label">{t('idea.underInvestigation', locale)}</span>
          </div>

          <h1 className="font-headline text-4xl md:text-7xl font-extrabold tracking-tighter leading-none italic text-white whitespace-pre-wrap break-words mb-10">
            {idea.title}
          </h1>

          <p className="font-body text-xl text-on-surface-variant leading-relaxed mb-12 whitespace-pre-wrap">
            {idea.description}
          </p>

          {/* Author block — newspaper byline, full width */}
          {ownerProfile && (
            <div className="border-y-2 border-white/10 my-12">
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
                <a
                  href={`/profile/${ownerProfile.id}`}
                  className="md:col-span-5 flex items-center gap-5 p-6 hover:bg-surface-container-low transition-colors no-underline group"
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-surface-container-highest flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {ownerProfile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ownerProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: 64 }}>account_circle</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-label text-[10px] uppercase tracking-[0.25em] text-primary block mb-1">{t('idea.founder', locale)}</span>
                    <span className="font-headline italic font-black text-3xl md:text-4xl text-white block truncate group-hover:text-primary transition-colors leading-tight">{ownerUsername}</span>
                    {ownerProfile.bio && (
                      <p className="font-body text-sm text-on-surface-variant mt-2 line-clamp-2">{ownerProfile.bio}</p>
                    )}
                    <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500 group-hover:text-primary transition-colors mt-2 inline-flex items-center gap-1">
                      View profile <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_outward</span>
                    </span>
                  </div>
                </a>

                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-1 divide-x md:divide-x-0 md:divide-y divide-white/10">
                  <div className="p-6 md:py-5">
                    <span className="block font-label text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Ideas</span>
                    <span className="font-headline italic font-black text-4xl text-white leading-none">{ownerStats.ideaCount}</span>
                  </div>
                  <div className="p-6 md:py-5">
                    <span className="block font-label text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Critiques</span>
                    <span className="font-headline italic font-black text-4xl text-primary leading-none">{ownerStats.totalFeedbacks}</span>
                  </div>
                </div>

                <div className="md:col-span-4 p-6">
                  <span className="block font-label text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Other projects</span>
                  {ownerOtherIdeas.length === 0 ? (
                    <p className="font-label text-[10px] uppercase tracking-widest text-neutral-700">No other ideas yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {ownerOtherIdeas.map(it => (
                        <li key={it.id}>
                          <a
                            href={`/idea/${it.id}`}
                            className="flex items-center justify-between gap-3 group no-underline py-1"
                          >
                            <span className="font-body text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1 flex-1">{it.title}</span>
                            <span className="font-label text-[10px] uppercase tracking-widest text-neutral-500 flex-shrink-0">{it.feedback_count} fb</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-neutral-500 tracking-widest mb-1">{t('idea.submissionDate', locale)}</span>
              <span className="font-label text-lg text-white">
                {new Date(idea.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {totalReviews > 0 && (
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-neutral-500 tracking-widest mb-1">{t('idea.survivalRate', locale)}</span>
                <span className="font-headline italic font-black text-3xl text-primary leading-none">{survivalRate}%</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-6">
              <BookmarkButton
                ideaId={idea.id}
                initial={isBookmarked}
                signedIn={!!currentUser && currentUser.is_anonymous === false}
              />
              <ShareButton url={`/idea/${idea.id}`} title={idea.title} />
            </div>
          </div>

          {currentUser && idea.user_id === currentUser.id && (
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a
                href={`/idea/${idea.id}/edit`}
                className="flex items-center gap-2 font-label text-[10px] uppercase tracking-widest text-neutral-600 hover:text-primary transition-colors no-underline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                Edit idea
              </a>
              <ArchiveButton ideaId={idea.id} />
              <DeleteButton ideaId={idea.id} />
            </div>
          )}
        </section>

        {/* Owner-only analytics panel — visible only to the idea author */}
        {isIdeaOwner && (
          <OwnerAnalyticsPanel
            views={idea.view_count ?? 0}
            totalReviews={totalReviews}
            totalUpvotes={totalUpvotes}
            allFeedbacks={allFeedbacks ?? []}
          />
        )}

        {/* Critique Submission — hidden for idea owner (no self-critique) and after first critique (inline edit) */}
        {isIdeaOwner ? (
          <div className="mb-12 bg-surface-container-low border-l-4 border-primary px-6 py-4">
            <p className="font-label text-[11px] uppercase tracking-widest text-primary">This is your idea</p>
            <p className="font-body text-sm text-on-surface-variant mt-1">Founders can&apos;t critique their own ideas. Sit back and let the community do it.</p>
          </div>
        ) : hasOwnFeedback ? (
          <div className="mb-12 bg-surface-container-low border-l-4 border-primary px-6 py-4">
            <p className="font-label text-[11px] uppercase tracking-widest text-primary">You&apos;ve already critiqued this idea</p>
            <p className="font-body text-sm text-on-surface-variant mt-1">Find your critique below — you can edit or delete it from there.</p>
          </div>
        ) : (
          <FeedbackForm ideaId={params.id} />
        )}

        {/* Comments Feed Section */}
        <section className="mb-24">
          <FeedbackList feedbacks={page} ideaId={params.id} hasMore={hasMore} currentUserId={currentUser?.id ?? null} />
        </section>

        {/* Stats and Sidebars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <aside className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Quick Stats */}
            <div className="bg-[#131313] p-10 space-y-8">
              <h3 className="font-headline text-2xl font-bold border-b border-[#494847]/10 pb-4 italic text-white">{t('idea.vitals', locale)}</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="font-label text-[10px] uppercase text-neutral-500 tracking-[0.2em]">{t('idea.bullinessIndex', locale)}</span>
                  <span className="font-headline text-2xl text-primary font-black italic">{bullyLevel}</span>
                </div>
                <div className="w-full h-[2px] bg-[#262626]">
                  <div className="h-full bg-primary" style={{ width: `${barWidth}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-[#262626] p-4 text-white">
                    <span className="block text-[8px] uppercase text-neutral-500 mb-1">{t('idea.reviews', locale)}</span>
                    <span className="font-label text-xl font-bold">{totalReviews}</span>
                  </div>
                  <div className="bg-[#262626] p-4 text-white">
                    <span className="block text-[8px] uppercase text-neutral-500 mb-1">{t('idea.upvotes', locale)}</span>
                    <span className="font-label text-xl font-bold">{totalUpvotes}</span>
                  </div>
                </div>
              </div>
              {/* Whitepaper download — sadece varsa göster */}
              {idea.whitepaper_url && (
                <a
                  href={idea.whitepaper_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-transparent border border-[#494847]/30 text-white font-label font-bold py-4 uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 no-underline"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  {t('idea.downloadWp', locale)}
                </a>
              )}
            </div>

            {/* Top Bullies — dinamik */}
            <div className="bg-[#1a1919]/30 p-10">
              <h3 className="font-headline text-2xl font-bold mb-8 italic text-white">{t('idea.topBullies', locale)}</h3>
              {topBullies.length > 0 ? (
                <div className="space-y-6">
                  {topBullies.map((bully, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <span className="font-headline italic text-neutral-600 text-xl group-hover:text-primary transition-colors">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p className="font-label font-bold text-sm text-white">@{bully.username}</p>
                          <p className="text-[9px] uppercase text-neutral-500">{bully.count} critique</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-neutral-600 group-hover:text-primary transition-colors">north_east</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-label text-xs text-neutral-600 uppercase tracking-widest">
                  {t('idea.noBullies', locale)}
                </p>
              )}
            </div>

            {/* Call to Action — challenge the visitor to post their own idea */}
            <div className="bg-primary p-10 flex flex-col justify-center gap-6">
              <h4 className="font-headline text-3xl font-black italic text-[#3a4a00] leading-tight">
                Think this is garbage?
              </h4>
              <p className="text-[#3a4a00] font-medium text-sm leading-relaxed">
                Then publish your own. Let the community tear it apart and see if yours survives the bully.
              </p>
              <a
                href="/submit"
                className="bg-black text-white font-label font-bold text-center py-4 uppercase text-xs tracking-[0.2em] hover:scale-[1.02] transition-transform no-underline"
              >
                Post your idea
              </a>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
