import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin'

export async function GET() {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_audit_log')
    .select('id, admin_id, action, target_type, target_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('audit fetch:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  // Hydrate admin usernames
  const adminIds = Array.from(new Set((data ?? []).map((r: any) => r.admin_id).filter(Boolean) as string[]))
  const profilesRes = adminIds.length
    ? await admin.from('profiles').select('id, username').in('id', adminIds)
    : { data: [] as any[] }
  const map = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p.username]))

  const hydrated = (data ?? []).map((r: any) => ({
    ...r,
    admin_username: r.admin_id ? map.get(r.admin_id) ?? null : null,
  }))

  return NextResponse.json({ entries: hydrated })
}
