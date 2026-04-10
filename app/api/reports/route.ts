import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function POST(request: Request) {
  const body = await request.json()
  const { idea_id, feedback_id, reason = '' } = body

  if (!idea_id && !feedback_id) {
    return NextResponse.json({ error: 'idea_id veya feedback_id gerekli' }, { status: 400 })
  }
  if (idea_id && feedback_id) {
    return NextResponse.json({ error: 'Sadece biri belirtilmeli' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const reporter_ip_hash = createHash('sha256').update(ip).digest('hex').slice(0, 16)

  const supabase = createServerClient()
  const { error } = await supabase
    .from('reports')
    .insert({ idea_id: idea_id ?? null, feedback_id: feedback_id ?? null, reporter_ip_hash, reason })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
