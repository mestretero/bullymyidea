import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'
import { logAdminAction } from '@/lib/admin-audit'
import { isUuid, cleanField } from '@/lib/sanitize'

// Resolve a report. Optional `action`:
//   - "dismiss":         just mark resolved, no content change
//   - "archive_idea":    flip target idea status='archived' (soft, recoverable)
//   - "delete_idea":     hard-delete target idea (cascades feedbacks/votes)
//   - "delete_feedback": hard-delete target feedback
//
// Body: { action?: 'dismiss' | 'archive_idea' | 'delete_idea' | 'delete_feedback', note?: string }

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const action = (
    body.action === 'archive_idea'
    || body.action === 'delete_idea'
    || body.action === 'delete_feedback'
  ) ? body.action : 'dismiss'
  const note = cleanField(body.note, 500)

  const admin = createAdminClient()
  const { data: report } = await admin
    .from('reports')
    .select('id, idea_id, feedback_id, status')
    .eq('id', params.id)
    .single()

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (report.status === 'resolved') return NextResponse.json({ error: 'Already resolved' }, { status: 400 })

  // Take action
  if (action === 'archive_idea' && report.idea_id) {
    await admin.from('ideas').update({ status: 'archived' }).eq('id', report.idea_id)
  } else if (action === 'delete_idea' && report.idea_id) {
    await admin.from('ideas').delete().eq('id', report.idea_id)
  } else if (action === 'delete_feedback' && report.feedback_id) {
    await admin.from('feedbacks').delete().eq('id', report.feedback_id)
  }

  const { error } = await admin
    .from('reports')
    .update({
      status: 'resolved',
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      admin_note: note || `action: ${action}`,
    })
    .eq('id', params.id)

  if (error) {
    console.error('admin report resolve:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  await logAdminAction({
    adminId: user.id,
    action: 'report_resolve',
    targetType: 'report',
    targetId: params.id,
    metadata: { resolution: action, idea_id: report.idea_id, feedback_id: report.feedback_id },
  })

  return NextResponse.json({ ok: true })
}
