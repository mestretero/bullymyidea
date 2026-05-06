import { createAdminClient } from '@/lib/supabase/admin'
import type { Category } from '@/types'

export function buildIdeasQuery(category: string | undefined) {
  const supabase = createAdminClient()
  let query = supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(21)

  if (category) {
    query = (query as any).eq('category', category as Category)
  }

  return query
}
