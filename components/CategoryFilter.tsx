'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

export default function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('category') ?? 'all'

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete('category')
    else params.set('category', value)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 0 20px' }}>
      {[{ value: 'all', label: 'Tümü' }, ...CATEGORIES].map(cat => (
        <button
          key={cat.value}
          onClick={() => setCategory(cat.value)}
          style={{
            fontSize: 12, padding: '4px 12px', borderRadius: 100, border: '1px solid',
            cursor: 'pointer', background: 'none',
            borderColor: active === cat.value ? '#ff3b5c' : '#1e1e1e',
            color: active === cat.value ? '#ff3b5c' : '#666',
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
