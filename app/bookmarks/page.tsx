import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import IdeaCard from '@/components/IdeaCard'
import type { Idea } from '@/types'

export const metadata: Metadata = { title: 'Saved Ideas' }

export default async function BookmarksPage() {
  const authClient = createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('bookmarks')
    .select('created_at, ideas(*, feedback_count:feedbacks(count))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const ideas: Idea[] = (data ?? [])
    .map((row: any) => row.ideas)
    .filter((i: any) => i && i.status === 'active')
    .map((i: any) => ({ ...i, feedback_count: i.feedback_count?.[0]?.count ?? 0 }))

  return (
    <div className="min-h-screen bg-surface pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-[1400px] mx-auto">
        <span className="font-label text-primary uppercase text-xs tracking-[0.3em] block mb-3">Library</span>
        <h1
          className="font-headline italic font-bold tracking-tighter text-on-surface leading-none mb-12"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Saved ideas.
        </h1>

        {ideas.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-headline italic text-3xl text-on-surface mb-3">Empty shelf.</p>
            <p className="font-body text-on-surface-variant mb-8">Bookmark ideas you want to revisit. They&apos;ll show up here.</p>
            <Link
              href="/"
              className="inline-block bg-primary text-black font-label font-black uppercase tracking-[0.2em] text-sm px-10 py-5 no-underline hover:brightness-110 transition-all"
            >
              Browse feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {ideas.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
          </div>
        )}
      </div>
    </div>
  )
}
