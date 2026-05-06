import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { isUuid } from '@/lib/sanitize'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { idea_id } = body
  if (!isUuid(idea_id)) return NextResponse.json({ error: 'Invalid idea_id' }, { status: 400 })

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const allowed = await checkRateLimit(user.id, 'bookmark', 200)
  if (!allowed) return NextResponse.json({ error: 'Too many bookmark actions' }, { status: 429 })

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('idea_id', idea_id)
    .maybeSingle()

  if (existing) {
    await admin.from('bookmarks').delete().eq('id', existing.id)
    return NextResponse.json({ bookmarked: false })
  }

  const { error } = await admin.from('bookmarks').insert({ user_id: user.id, idea_id })
  if (error) {
    console.error('bookmark insert error:', error)
    return NextResponse.json({ error: 'Bookmark failed' }, { status: 500 })
  }
  return NextResponse.json({ bookmarked: true })
}

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ideas: [] })

  const admin = createAdminClient()
  const { data } = await admin
    .from('bookmarks')
    .select('idea_id, created_at, ideas(id, title, description, category, tags, media_urls, created_at, status, user_id, feedback_count:feedbacks(count))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  const ideas = (data ?? [])
    .map((row: any) => row.ideas)
    .filter((i: any) => i && i.status === 'active')
    .map((i: any) => ({ ...i, feedback_count: i.feedback_count?.[0]?.count ?? 0 }))

  return NextResponse.json({ ideas })
}
