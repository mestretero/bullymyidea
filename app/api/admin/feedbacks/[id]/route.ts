import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'
import { logAdminAction } from '@/lib/admin-audit'
import { isUuid } from '@/lib/sanitize'

// Hard-delete any feedback, regardless of owner.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('feedbacks').delete().eq('id', params.id)
  if (error) {
    console.error('admin feedback delete:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
  await logAdminAction({ adminId: me.id, action: 'feedback_delete', targetType: 'feedback', targetId: params.id })
  return NextResponse.json({ ok: true })
}
