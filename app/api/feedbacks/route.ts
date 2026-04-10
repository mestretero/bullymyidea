import { createServerClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { idea_id, strengths = '', weaknesses = '', suggestions = '' } = body

  if (!idea_id) return NextResponse.json({ error: 'idea_id gerekli' }, { status: 400 })
  if (!strengths.trim() && !weaknesses.trim() && !suggestions.trim()) {
    return NextResponse.json({ error: 'En az bir alan doldur' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const allowed = await checkRateLimit(ip, 'feedback', 3)
  if (!allowed) return NextResponse.json({ error: 'Günlük limit aşıldı (3/gün)' }, { status: 429 })

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

  const { data, error } = await supabase
    .from('feedbacks')
    .insert({ idea_id, strengths, weaknesses, suggestions, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idea_id = searchParams.get('idea_id')
  const cursor = searchParams.get('cursor')
  const PAGE_SIZE = 10

  if (!idea_id) return NextResponse.json({ error: 'idea_id gerekli' }, { status: 400 })

  const supabase = createServerClient()
  let query = supabase
    .from('feedbacks')
    .select('*')
    .eq('idea_id', idea_id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (cursor) query = (query as any).lt('created_at', cursor)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const hasMore = (data?.length ?? 0) > PAGE_SIZE
  return NextResponse.json({
    feedbacks: hasMore ? data!.slice(0, PAGE_SIZE) : data ?? [],
    has_more: hasMore,
  })
}
