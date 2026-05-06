import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { cleanField, isUuid } from '@/lib/sanitize'

export async function POST(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const idea_id = body.idea_id
  const feedback_id = body.feedback_id
  const reason = cleanField(body.reason, 500)

  if (!idea_id && !feedback_id) {
    return NextResponse.json({ error: 'idea_id or feedback_id is required' }, { status: 400 })
  }
  if (idea_id && feedback_id) {
    return NextResponse.json({ error: 'Specify only one' }, { status: 400 })
  }
  if (idea_id && !isUuid(idea_id)) {
    return NextResponse.json({ error: 'Invalid idea_id' }, { status: 400 })
  }
  if (feedback_id && !isUuid(feedback_id)) {
    return NextResponse.json({ error: 'Invalid feedback_id' }, { status: 400 })
  }

  const allowed = await checkRateLimit(user.id, 'report', 10)
  if (!allowed) return NextResponse.json({ error: 'Too many reports' }, { status: 429 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('reports')
    .insert({
      idea_id: idea_id ?? null,
      feedback_id: feedback_id ?? null,
      reason,
      reporter_user_id: user.id,
      reporter_ip_hash: 'auth',
    })

  if (error) {
    console.error('reports insert error:', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
