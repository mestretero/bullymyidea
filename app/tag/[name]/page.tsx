import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import IdeaCard from '@/components/IdeaCard'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Idea } from '@/types'

interface Props { params: { name: string } }

const TAG_PATTERN = /^[a-z0-9-]{1,30}$/

function normalizeTag(raw: string): string | null {
  const decoded = decodeURIComponent(raw).toLowerCase()
  return TAG_PATTERN.test(decoded) ? decoded : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = normalizeTag(params.name)
  if (!tag) return { title: 'Tag not found' }
  const display = `#${tag}`
  return {
    title: `${display} ideas`,
    description: `Founder ideas tagged ${display} — open to brutal community critique on BullyMyIdea.`,
    openGraph: {
      title: `${display} on BullyMyIdea`,
      description: `Ideas tagged ${display} — under fire from the community.`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${display} ideas — BullyMyIdea`,
      description: `Ideas tagged ${display}, open to brutal community critique.`,
    },
  }
}

export default async function TagPage({ params }: Props) {
  const tag = normalizeTag(params.name)
  if (!tag) return notFound()

  const admin = createAdminClient()
  const { data: ideasRaw } = await admin
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('status', 'active')
    .contains('tags', [tag])
    .order('created_at', { ascending: false })
    .limit(60)

  const ideas: Idea[] = (ideasRaw ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-[1400px] mx-auto">

        {/* Breadcrumb */}
        <Link
          href="/categories"
          className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary no-underline inline-block mb-6"
        >
          ← All categories
        </Link>

        {/* Header */}
        <header className="mb-16">
          <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">Tag</span>
          <h1
            className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}
          >
            #{tag}
          </h1>
          <p className="font-body text-on-surface-variant text-base">
            {ideas.length === 0
              ? 'No ideas yet under this tag.'
              : `${ideas.length} idea${ideas.length === 1 ? '' : 's'} tagged ${`#${tag}`}.`}
          </p>
        </header>

        {/* Grid */}
        {ideas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="font-headline italic text-3xl text-on-surface mb-3">Empty tag.</p>
            <p className="font-body text-on-surface-variant max-w-md mx-auto">
              No active ideas use <code className="font-mono text-primary">#{tag}</code> yet. Be the first to post one.
            </p>
            <Link
              href="/submit"
              className="inline-block mt-8 bg-primary text-black font-label font-black uppercase tracking-[0.2em] text-sm px-10 py-4 hover:brightness-110 transition-all no-underline"
            >
              Post an idea
            </Link>
          </div>
        )}

        {ideas.length >= 60 && (
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant text-center mt-12">
            Showing first 60 — use{' '}
            <Link href={`/search?tag=${encodeURIComponent(tag)}`} className="text-primary no-underline">
              search
            </Link>
            {' '}for more.
          </p>
        )}
      </div>
    </div>
  )
}
