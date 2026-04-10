import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CATEGORY_VALUES } from '@/lib/categories'

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description, category, tags = [] } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Başlık gerekli' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'Açıklama gerekli' }, { status: 400 })
  if (!CATEGORY_VALUES.includes(category)) return NextResponse.json({ error: 'Geçersiz kategori' }, { status: 400 })

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Oturum açılmamış' }, { status: 401 })

  const normalizedTags = (tags as string[])
    .map(t => t.trim().toLowerCase().replace(/[^a-z0-9ğüşıöçğüşıöç]/gi, ''))
    .filter(Boolean)
    .slice(0, 5)

  const { data, error } = await supabase
    .from('ideas')
    .insert({ title: title.trim(), description: description.trim(), category, tags: normalizedTags, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
