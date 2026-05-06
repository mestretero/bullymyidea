import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { LIMITS, MIN_FORM_DWELL_SECONDS } from '@/lib/limits'
import { cleanField, cleanLongField, isUuid } from '@/lib/sanitize'
import { isImpersonationAttempt } from '@/lib/reserved'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { idea_id, strengths = '', weaknesses = '', suggestions = '', display_name = '', website = '', form_loaded_at } = body

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

  if (!isUuid(idea_id)) return NextResponse.json({ error: 'Invalid idea_id' }, { status: 400 })

  const cleanStrengths = cleanLongField(strengths, LIMITS.feedbackField)
  const cleanWeaknesses = cleanLongField(weaknesses, LIMITS.feedbackField)
  const cleanSuggestions = cleanLongField(suggestions, LIMITS.feedbackField)
  const cleanDisplayName = cleanField(display_name, LIMITS.displayName)
  if (cleanDisplayName && isImpersonationAttempt(cleanDisplayName)) {
    return NextResponse.json({ error: 'That display name is not allowed' }, { status: 400 })
  }

  if (!cleanStrengths.trim() && !cleanWeaknesses.trim() && !cleanSuggestions.trim()) {
    return NextResponse.json({ error: 'Fill in at least one field' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (user.is_anonymous) return NextResponse.json({ error: 'Sign in to critique' }, { status: 401 })

  const admin = createAdminClient()

  const { data: ideaOwner } = await admin.from('ideas').select('user_id, status').eq('id', idea_id).single()
  if (!ideaOwner || ideaOwner.status !== 'active') {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }
  if (ideaOwner.user_id === user.id) {
    return NextResponse.json({ error: 'You cannot critique your own idea' }, { status: 400 })
  }

  const allowed = await checkRateLimit(user.id, 'feedback', 10)
  if (!allowed) return NextResponse.json({ error: 'Daily critique limit reached' }, { status: 429 })

  const { data, error } = await admin
    .from('feedbacks')
    .insert({
      idea_id,
      strengths: cleanStrengths,
      weaknesses: cleanWeaknesses,
      suggestions: cleanSuggestions,
      user_id: user.id,
      language: 'en',
      display_name: cleanDisplayName,
    })
    .select()
    .single()

  if (error) {
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'You have already critiqued this idea. Edit your existing critique instead.' }, { status: 409 })
    }
    console.error('feedbacks insert error:', error)
    return NextResponse.json({ error: 'Failed to publish critique' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idea_id = searchParams.get('idea_id')
  const cursor = searchParams.get('cursor')
  const PAGE_SIZE = 10

  if (!isUuid(idea_id)) return NextResponse.json({ error: 'Invalid idea_id' }, { status: 400 })

  const admin = createAdminClient()

  // Only allow reading feedback for active ideas (replicates the old RLS check)
  const { data: idea } = await admin.from('ideas').select('status').eq('id', idea_id!).single()
  if (!idea || idea.status !== 'active') return NextResponse.json({ feedbacks: [], has_more: false })

  let query = admin
    .from('feedbacks')
    .select('*')
    .eq('idea_id', idea_id!)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (cursor) query = (query as any).lt('created_at', cursor)

  const { data, error } = await query
  if (error) {
    console.error('feedbacks list error:', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE
  return NextResponse.json({
    feedbacks: hasMore ? data!.slice(0, PAGE_SIZE) : data ?? [],
    has_more: hasMore,
  })
}
