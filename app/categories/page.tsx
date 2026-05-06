import { CATEGORIES } from '@/lib/categories'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCategoryCountMap } from '@/lib/build-category-count-map'
import type { Idea } from '@/types'
import CategoriesView from '@/components/CategoriesView'

const CATEGORY_ICONS: Record<string, string> = {
  technology:    'computer',
  art:           'palette',
  business:      'business_center',
  social:        'groups',
  education:     'school',
  health:        'favorite',
  entertainment: 'celebration',
  other:         'more_horiz',
}

const SECTOR_CODES: Record<string, string> = {
  technology:    'SEC: 001',
  art:           'SEC: 002',
  business:      'SEC: 003',
  social:        'SEC: 004',
  education:     'SEC: 005',
  health:        'SEC: 006',
  entertainment: 'SEC: 007',
  other:         'SEC: 008',
}

export default async function CategoriesPage() {
  const supabase = createAdminClient()

  const { data: allIdeasRaw } = await supabase
    .from('ideas')
    .select('*, feedback_count:feedbacks(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const allIdeas: Idea[] = (allIdeasRaw ?? []).map((idea: any) => ({
    ...idea,
    feedback_count: idea.feedback_count?.[0]?.count ?? 0,
  }))

  const countMap = buildCategoryCountMap(allIdeasRaw ?? [])
  const sorted = [...CATEGORIES].sort((a, b) => (countMap[b.value] ?? 0) - (countMap[a.value] ?? 0))

  return (
    <CategoriesView
      allIdeas={allIdeas}
      countMap={countMap}
      sortedCategories={sorted.map(c => c.value)}
      categoryIcons={CATEGORY_ICONS}
      sectorCodes={SECTOR_CODES}
    />
  )
}
