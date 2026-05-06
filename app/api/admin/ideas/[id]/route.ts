import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'
import { logAdminAction } from '@/lib/admin-audit'
import { isUuid } from '@/lib/sanitize'

// Hard-delete any idea, regardless of owner. Cascades to feedbacks, votes, etc.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('ideas').delete().eq('id', params.id)
  if (error) {
    console.error('admin idea delete:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
  await logAdminAction({ adminId: me.id, action: 'idea_delete', targetType: 'idea', targetId: params.id })
  return NextResponse.json({ ok: true })
}
