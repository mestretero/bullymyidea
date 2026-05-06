import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { CATEGORY_VALUES } from '@/lib/categories'
import { extractYouTubeId } from '@/lib/youtube'
import { LIMITS } from '@/lib/limits'
import { isAllowedWhitepaperUrl, isAllowedMediaUrl } from '@/lib/storage'
import { checkRateLimit } from '@/lib/rate-limit'
import { cleanField, cleanLongField, isUuid } from '@/lib/sanitize'

async function verifyOwnership(id: string) {
  if (!isUuid(id)) return { error: NextResponse.json({ error: 'Invalid id' }, { status: 400 }) }
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }

  const admin = createAdminClient()
  const { data: idea } = await admin.from('ideas').select('user_id, status').eq('id', id).single()
  if (!idea) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (idea.user_id !== user.id) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, idea, admin }
}

// PATCH = toggle status. Body { status: 'active' | 'archived' }; missing/invalid
// body defaults to 'archived' (preserves the original archive button behaviour).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const check = await verifyOwnership(params.id)
  if ('error' in check) return check.error

  const allowed = await checkRateLimit(check.user.id, 'idea_archive', 30)
  if (!allowed) return NextResponse.json({ error: 'Too many archive operations' }, { status: 429 })

  const body = await request.json().catch(() => ({}))
  const targetStatus: 'active' | 'archived' =
    body?.status === 'active' ? 'active' : 'archived'

  const { error } = await check.admin
    .from('ideas')
    .update({ status: targetStatus })
    .eq('id', params.id)
    .eq('user_id', check.user.id)
  if (error) {
    console.error('idea status change error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, status: targetStatus })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await verifyOwnership(params.id)
  if ('error' in check) return check.error
  if (check.idea.status === 'archived') {
    return NextResponse.json({ error: 'Cannot edit archived idea' }, { status: 400 })
  }

  const allowed = await checkRateLimit(check.user.id, 'idea_edit', 30)
  if (!allowed) return NextResponse.json({ error: 'Too many edits' }, { status: 429 })

  const body = await request.json().catch(() => ({}))
  const { title, description, category, tags, youtube_url, whitepaper_url, media_urls } = body

  const updates: Record<string, unknown> = {}

  if (typeof title === 'string') {
    const v = cleanField(title, LIMITS.ideaTitle.max)
    if (v.length < LIMITS.ideaTitle.min) {
      return NextResponse.json({ error: `Title must be ${LIMITS.ideaTitle.min}-${LIMITS.ideaTitle.max} chars` }, { status: 400 })
    }
    updates.title = v
  }
  if (typeof description === 'string') {
    const v = cleanLongField(description, LIMITS.ideaDescription.max).trim()
    if (v.length < LIMITS.ideaDescription.min) {
      return NextResponse.json({ error: `Description must be ${LIMITS.ideaDescription.min}-${LIMITS.ideaDescription.max} chars` }, { status: 400 })
    }
    updates.description = v
  }
  if (typeof category === 'string') {
    if (!CATEGORY_VALUES.includes(category as any)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    updates.category = category
  }
  if (Array.isArray(tags)) {
    updates.tags = Array.from(new Set(
      tags
        .filter((tag: unknown): tag is string => typeof tag === 'string')
        .map((tag: string) => tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, LIMITS.ideaTagLength))
        .filter(Boolean)
    )).slice(0, LIMITS.ideaTagCount)
  }
  if (typeof youtube_url === 'string') {
    if (!youtube_url.trim()) {
      updates.youtube_url = ''
    } else {
      const id = extractYouTubeId(youtube_url)
      if (!id) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
      updates.youtube_url = `https://www.youtube.com/watch?v=${id}`
    }
  }
  if (typeof whitepaper_url === 'string') {
    if (!whitepaper_url.trim()) {
      updates.whitepaper_url = ''
    } else if (isAllowedWhitepaperUrl(whitepaper_url)) {
      updates.whitepaper_url = whitepaper_url
    } else {
      return NextResponse.json({ error: 'Whitepaper URL not allowed' }, { status: 400 })
    }
  }
  if (Array.isArray(media_urls)) {
    updates.media_urls = media_urls
      .filter((u: unknown) => isAllowedMediaUrl(u))
      .slice(0, 5)
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await check.admin
    .from('ideas')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', check.user.id)
  if (error) {
    console.error('idea update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const check = await verifyOwnership(params.id)
  if ('error' in check) return check.error

  const allowed = await checkRateLimit(check.user.id, 'idea_delete', 10)
  if (!allowed) return NextResponse.json({ error: 'Too many deletes' }, { status: 429 })

  const { error } = await check.admin
    .from('ideas')
    .delete()
    .eq('id', params.id)
    .eq('user_id', check.user.id)
  if (error) {
    console.error('idea delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
