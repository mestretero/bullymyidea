import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { LIMITS } from '@/lib/limits'
import { checkRateLimit } from '@/lib/rate-limit'
import { cleanLongField, isUuid } from '@/lib/sanitize'

async function verifyOwnership(id: string) {
  if (!isUuid(id)) return { error: NextResponse.json({ error: 'Invalid id' }, { status: 400 }) }
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  const admin = createAdminClient()
  const { data: feedback } = await admin.from('feedbacks').select('user_id, idea_id').eq('id', id).single()
  if (!feedback) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (feedback.user_id !== user.id) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, feedback, admin }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await verifyOwnership(params.id)
  if ('error' in check) return check.error

  // Block edits when the parent idea is archived (matches old RLS behavior).
  const { data: idea } = await check.admin.from('ideas').select('status').eq('id', check.feedback.idea_id).single()
  if (!idea || idea.status !== 'active') {
    return NextResponse.json({ error: 'Idea is no longer active' }, { status: 400 })
  }

  const allowed = await checkRateLimit(check.user.id, 'feedback_edit', 30)
  if (!allowed) return NextResponse.json({ error: 'Too many edits' }, { status: 429 })

  const body = await request.json().catch(() => ({}))
  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ error: 'Spam detected' }, { status: 400 })
  }
  const cleanStrengths = cleanLongField(body.strengths, LIMITS.feedbackField)
  const cleanWeaknesses = cleanLongField(body.weaknesses, LIMITS.feedbackField)
  const cleanSuggestions = cleanLongField(body.suggestions, LIMITS.feedbackField)

  if (!cleanStrengths.trim() && !cleanWeaknesses.trim() && !cleanSuggestions.trim()) {
    return NextResponse.json({ error: 'Fill in at least one field' }, { status: 400 })
  }

  const { error } = await check.admin
    .from('feedbacks')
    .update({ strengths: cleanStrengths, weaknesses: cleanWeaknesses, suggestions: cleanSuggestions })
    .eq('id', params.id)
    .eq('user_id', check.user.id)

  if (error) {
    console.error('feedbacks update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const check = await verifyOwnership(params.id)
  if ('error' in check) return check.error

  const allowed = await checkRateLimit(check.user.id, 'feedback_delete', 50)
  if (!allowed) return NextResponse.json({ error: 'Too many deletes' }, { status: 429 })

  const { error } = await check.admin
    .from('feedbacks')
    .delete()
    .eq('id', params.id)
    .eq('user_id', check.user.id)
  if (error) {
    console.error('feedbacks delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
