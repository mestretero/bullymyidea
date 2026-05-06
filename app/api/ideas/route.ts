import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { CATEGORY_VALUES } from '@/lib/categories'
import { extractYouTubeId } from '@/lib/youtube'
import { LIMITS, MIN_FORM_DWELL_SECONDS } from '@/lib/limits'
import { isAllowedStorageUrl } from '@/lib/storage'
import { checkRateLimit } from '@/lib/rate-limit'
import { cleanField, cleanLongField } from '@/lib/sanitize'

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const cursor = searchParams.get('cursor')
  const offsetParam = parseInt(searchParams.get('offset') ?? '0', 10)
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? Math.min(offsetParam, 1000) : 0
  const sortParam = searchParams.get('sort')
  const sort: 'newest' | 'trending' | 'controversial' =
    sortParam === 'trending' ? 'trending'
    : sortParam === 'controversial' ? 'controversial'
    : 'newest'

  const admin = createAdminClient()

  if (sort === 'controversial') {
    // Controversial: ideas whose feedback votes split — high min(up,down)/max(up,down)
    // ratio AND non-trivial activity. Like trending, score is computed in-app so
    // pagination is offset-based.
    let q = admin
      .from('ideas')
      .select('*, feedbacks(votes(vote_type))')
      .eq('status', 'active')
      .limit(200)

    if (category && CATEGORY_VALUES.includes(category as any)) {
      q = (q as any).eq('category', category)
    }

    const { data, error } = await q
    if (error) {
      console.error('controversial fetch error:', error)
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
    }

    const scored = (data ?? []).map((idea: any) => {
      const fbList: any[] = idea.feedbacks ?? []
      let up = 0, down = 0
      for (const fb of fbList) {
        for (const v of (fb.votes ?? [])) {
          if (v.vote_type === 'up') up++
          else if (v.vote_type === 'down') down++
        }
      }
      const totalVotes = up + down
      // Need minimum activity to qualify as controversial.
      // Also weight by activity volume (50/50 with 100 votes > 5/5 with 10 votes).
      const balance = totalVotes > 0 ? Math.min(up, down) / Math.max(up, down) : 0
      const score = totalVotes >= 4 ? balance * Math.log(totalVotes + 1) : 0
      return { ...idea, _score: score, feedback_count: fbList.length, _votes: totalVotes }
    })

    scored.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Drop ideas with 0 score (not controversial) so the feed isn't padded with calm ideas.
    const filtered = scored.filter(i => i._score > 0)

    const slice = filtered.slice(offset, offset + PAGE_SIZE)
    const ideas = slice.map(({ _score, feedbacks, _votes, ...rest }: any) => rest)
    const hasMore = filtered.length > offset + PAGE_SIZE
    return NextResponse.json({ ideas, has_more: hasMore, next_offset: offset + ideas.length })
  }

  if (sort === 'trending') {
    // Trending: offset-based pagination since the page-order key (_score) is
    // computed in-app, not in DB — date-based cursor would gap/duplicate.
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    let q = admin
      .from('ideas')
      .select('*, feedbacks(created_at)')
      .eq('status', 'active')
      .gte('created_at', since)
      .limit(120)

    if (category && CATEGORY_VALUES.includes(category as any)) {
      q = (q as any).eq('category', category)
    }

    const { data, error } = await q
    if (error) {
      console.error('trending fetch error:', error)
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
    }

    const now = Date.now()
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    const scored = (data ?? []).map((idea: any) => {
      const fbList: { created_at: string }[] = idea.feedbacks ?? []
      let score = 0
      for (const fb of fbList) {
        const age = now - new Date(fb.created_at).getTime()
        if (age < SEVEN_DAYS) score += 1.5
        else score += 0.5
      }
      const ideaAge = now - new Date(idea.created_at).getTime()
      if (ideaAge < 2 * 24 * 60 * 60 * 1000) score += 0.5
      return { ...idea, _score: score, feedback_count: fbList.length }
    })
    // Sort by score desc; tie-break by created_at desc for deterministic order
    // across requests (cache-friendly, no shuffle on equal scores).
    scored.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    const slice = scored.slice(offset, offset + PAGE_SIZE)
    const ideas = slice.map(({ _score, feedbacks, ...rest }: any) => rest)
    const hasMore = scored.length > offset + PAGE_SIZE
    return NextResponse.json({ ideas, has_more: hasMore, next_offset: offset + ideas.length })
  }

  let query = admin
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (category && CATEGORY_VALUES.includes(category as any)) {
    query = (query as any).eq('category', category)
  }
  if (cursor) {
    query = (query as any).lt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) {
    console.error('ideas list error:', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE
  const ideas = (hasMore ? data!.slice(0, PAGE_SIZE) : data ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  return NextResponse.json({ ideas, has_more: hasMore })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { title, description, category, tags = [], media_urls = [], whitepaper_url = '', youtube_url = '', website = '', form_loaded_at } = body

  if (typeof website === 'string' && website.trim()) {
    return NextResponse.json({ error: 'Spam detected' }, { status: 400 })
  }
  if (typeof form_loaded_at !== 'number' || !Number.isFinite(form_loaded_at)) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }
  const elapsed = (Date.now() - form_loaded_at) / 1000
  if (elapsed < MIN_FORM_DWELL_SECONDS) {
    return NextResponse.json({ error: 'Submitted too fast' }, { status: 400 })
  }

  const cleanTitle = cleanField(title, LIMITS.ideaTitle.max)
  const cleanDescription = cleanLongField(description, LIMITS.ideaDescription.max).trim()
  if (cleanTitle.length < LIMITS.ideaTitle.min) {
    return NextResponse.json({ error: `Title must be ${LIMITS.ideaTitle.min}-${LIMITS.ideaTitle.max} chars` }, { status: 400 })
  }
  if (cleanDescription.length < LIMITS.ideaDescription.min) {
    return NextResponse.json({ error: `Description must be ${LIMITS.ideaDescription.min}-${LIMITS.ideaDescription.max} chars` }, { status: 400 })
  }
  if (!CATEGORY_VALUES.includes(category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

  let youtubeUrl = ''
  if (typeof youtube_url === 'string' && youtube_url.trim()) {
    const id = extractYouTubeId(youtube_url)
    if (!id) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    youtubeUrl = `https://www.youtube.com/watch?v=${id}`
  }

  let whitepaperClean = ''
  if (typeof whitepaper_url === 'string' && whitepaper_url.trim()) {
    if (!isAllowedStorageUrl(whitepaper_url.trim())) {
      return NextResponse.json({ error: 'Whitepaper URL not allowed' }, { status: 400 })
    }
    whitepaperClean = whitepaper_url.trim()
  }

  const cleanMediaUrls = (Array.isArray(media_urls) ? media_urls : [])
    .filter((u: unknown) => typeof u === 'string' && isAllowedStorageUrl(u))
    .slice(0, 5)

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (user.is_anonymous) return NextResponse.json({ error: 'Sign in to post ideas' }, { status: 401 })

  const allowed = await checkRateLimit(user.id, 'idea', 5)
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached (5/day)' }, { status: 429 })

  const normalizedTags = Array.from(new Set(
    (tags as string[])
      .map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, LIMITS.ideaTagLength))
      .filter(Boolean)
  )).slice(0, LIMITS.ideaTagCount)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ideas')
    .insert({
      title: cleanTitle,
      description: cleanDescription,
      category,
      tags: normalizedTags,
      user_id: user.id,
      media_urls: cleanMediaUrls,
      whitepaper_url: whitepaperClean,
      youtube_url: youtubeUrl,
      language: 'en',
    })
    .select()
    .single()

  if (error) {
    console.error('ideas insert error:', error)
    return NextResponse.json({ error: 'Failed to post idea' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
