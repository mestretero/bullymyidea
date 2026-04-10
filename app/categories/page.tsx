import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { createServerClient } from '@/lib/supabase/server'
import { buildCategoryCountMap } from '@/lib/build-category-count-map'

export default async function CategoriesPage() {
  const supabase = createServerClient()

  const { data: counts } = await supabase
    .from('ideas')
    .select('category')
    .eq('status', 'active')

  const countMap = buildCategoryCountMap(counts ?? [])

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', marginBottom: 32 }}>
        Kategoriler
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {CATEGORIES.map(cat => (
          <Link key={cat.value} href={`/?category=${cat.value}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#141414', border: '1px solid #1e1e1e',
              borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: cat.color, marginBottom: 4 }}>
                {cat.label}
              </div>
              <div style={{ fontSize: 12, color: '#444' }}>
                {countMap[cat.value] ?? 0} fikir
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
