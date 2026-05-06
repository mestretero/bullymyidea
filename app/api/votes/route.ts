import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { isUuid } from '@/lib/sanitize'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { feedback_id, vote_type } = body

  if (!isUuid(feedback_id)) return NextResponse.json({ error: 'Invalid feedback_id' }, { status: 400 })
  if (!['up', 'down'].includes(vote_type)) return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const admin = createAdminClient()

  // Disallow voting on own feedback (no farming). Use a single generic
  // error for both "not found" and "self-vote" so attackers can't enumerate
  // feedback authorship by probing.
  const { data: fb } = await admin.from('feedbacks').select('user_id').eq('id', feedback_id).single()
  if (!fb || fb.user_id === user.id) {
    return NextResponse.json({ error: 'Vote not allowed' }, { status: 400 })
  }

  const allowed = await checkRateLimit(user.id, 'vote', 200)
  if (!allowed) return NextResponse.json({ error: 'Daily vote limit reached' }, { status: 429 })

  const { data: existing } = await admin
    .from('votes')
    .select('id, vote_type')
    .eq('feedback_id', feedback_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.vote_type === vote_type) {
    await admin.from('votes').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  }

  const { error } = await admin
    .from('votes')
    .upsert(
      { feedback_id, vote_type, user_id: user.id },
      { onConflict: 'feedback_id,user_id' }
    )
  if (error) {
    console.error('votes upsert error:', error)
    return NextResponse.json({ error: 'Vote failed' }, { status: 500 })
  }
  return NextResponse.json({ action: existing ? 'changed' : 'added' })
}
