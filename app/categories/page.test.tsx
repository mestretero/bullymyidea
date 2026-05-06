import { describe, it, expect } from 'vitest'
import { buildCategoryCountMap } from '@/lib/build-category-count-map'

describe('buildCategoryCountMap', () => {
  it('counts ideas per category', () => {
    const rows = [{ category: 'technology' }, { category: 'technology' }, { category: 'art' }]
    const result = buildCategoryCountMap(rows)
    expect(result['technology']).toBe(2)
    expect(result['art']).toBe(1)
    expect(result['business']).toBeUndefined()
  })

  it('returns empty object for empty input', () => {
    expect(buildCategoryCountMap([])).toEqual({})
  })
})
