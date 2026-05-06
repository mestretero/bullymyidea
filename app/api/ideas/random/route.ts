import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()

  // Count active ideas, pick a random offset, fetch that single row.
  // Cheap enough at sub-million scale; if it ever becomes hot we can
  // switch to TABLESAMPLE BERNOULLI on the SQL side.
  const { count } = await admin
    .from('ideas')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  if (!count || count === 0) {
    return NextResponse.json({ error: 'No ideas yet' }, { status: 404 })
  }

  const offset = Math.floor(Math.random() * count)
  const { data, error } = await admin
    .from('ideas')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset)
    .limit(1)
    .single()

  if (error || !data) {
    console.error('random idea error:', error)
    return NextResponse.json({ error: 'Failed to roll' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
