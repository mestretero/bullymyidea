import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { feedback_id, vote_type } = body

  if (!feedback_id) return NextResponse.json({ error: 'feedback_id gerekli' }, { status: 400 })
  if (!['up', 'down'].includes(vote_type)) return NextResponse.json({ error: 'Geçersiz oy tipi' }, { status: 400 })

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

  // Check for existing vote
  const { data: existing } = await supabase
    .from('votes')
    .select('id, vote_type')
    .eq('feedback_id', feedback_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.vote_type === vote_type) {
      // Toggle off
      await supabase.from('votes').delete().eq('id', existing.id)
      return NextResponse.json({ action: 'removed' })
    } else {
      // Change vote
      const { error } = await supabase.from('votes').update({ vote_type }).eq('id', existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ action: 'changed' })
    }
  }

  const { error } = await supabase
    .from('votes')
    .insert({ feedback_id, vote_type, user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ action: 'added' })
}
