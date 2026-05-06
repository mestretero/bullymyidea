import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { CATEGORY_VALUES } from '@/lib/categories'
import { getClientIp } from '@/lib/get-client-ip'

type SortMode = 'recent' | 'bullied'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim().slice(0, 80)
  const categoryParam = searchParams.get('category') ?? ''
  const tagParamRaw = (searchParams.get('tag') ?? '').trim().toLowerCase().slice(0, 30)
  const tagParam = tagParamRaw.replace(/[^a-z0-9-]/g, '') // safe tag chars only
  const sort: SortMode = searchParams.get('sort') === 'bullied' ? 'bullied' : 'recent'

  // Empty query AND no filters → return empty (don't dump the whole DB).
  if (!q && !categoryParam && !tagParam) {
    return NextResponse.json({ ideas: [], profiles: [] })
  }
  if (q && q.length < 2) return NextResponse.json({ ideas: [], profiles: [] })

  const ip = getClientIp(request.headers)
  const allowed = await checkRateLimit(`search:${ip}`, 'search', 600)
  if (!allowed) return NextResponse.json({ error: 'Too many searches' }, { status: 429 })

  const admin = createAdminClient()

  const safe = q
    .replace(/[%_\\]/g, m => '\\' + m)
    .replace(/[(),:]/g, '')
  const pattern = safe ? `%${safe}%` : null

  const validCategory = CATEGORY_VALUES.includes(categoryParam as any) ? categoryParam : ''

  function applyFilters<T extends { eq: any; contains: any; order: any }>(query: T): T {
    let q2: any = query
    if (validCategory) q2 = q2.eq('category', validCategory)
    if (tagParam) q2 = q2.contains('tags', [tagParam])
    return q2
  }

  // Ideas search: run title and description matches in parallel, dedupe.
  // When pattern is null (filters-only browse), just fetch by filter.
  const ideaSelect = 'id, title, description, category, tags, media_urls, created_at, feedback_count:feedbacks(count)'

  const ideaPromises: any[] = []
  if (pattern) {
    ideaPromises.push(
      applyFilters(
        admin.from('ideas').select(ideaSelect).eq('status', 'active').ilike('title', pattern)
      ).order('created_at', { ascending: false }).limit(40)
    )
    ideaPromises.push(
      applyFilters(
        admin.from('ideas').select(ideaSelect).eq('status', 'active').ilike('description', pattern)
      ).order('created_at', { ascending: false }).limit(40)
    )
  } else {
    ideaPromises.push(
      applyFilters(
        admin.from('ideas').select(ideaSelect).eq('status', 'active')
      ).order('created_at', { ascending: false }).limit(40)
    )
  }

  // Profiles only matter when there's a text query.
  const profilesPromise = pattern
    ? admin
        .from('profiles')
        .select('id, username, bio, avatar_url')
        .not('username', 'is', null)
        .ilike('username', pattern)
        .limit(10)
    : Promise.resolve({ data: [] as any[] })

  const [ideasResults, profilesRes] = await Promise.all([
    Promise.all(ideaPromises),
    profilesPromise as any,
  ])

  // Dedupe across title/description matches.
  const seen = new Set<string>()
  let merged: any[] = []
  for (const res of ideasResults) {
    for (const i of (res.data ?? []) as any[]) {
      if (seen.has(i.id)) continue
      seen.add(i.id)
      merged.push({ ...i, feedback_count: i.feedback_count?.[0]?.count ?? 0 })
    }
  }

  // Sort.
  if (sort === 'bullied') {
    merged.sort((a, b) => (b.feedback_count ?? 0) - (a.feedback_count ?? 0))
  } else {
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return NextResponse.json({
    ideas: merged.slice(0, 30),
    profiles: profilesRes.data ?? [],
  })
}
