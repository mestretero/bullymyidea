import { describe, it, expect } from 'vitest'
import { buildCategoryCountMap } from './page'

describe('buildCategoryCountMap', () => {
  it('counts ideas per category', () => {
    const rows = [{ category: 'teknoloji' }, { category: 'teknoloji' }, { category: 'sanat' }]
    const result = buildCategoryCountMap(rows)
    expect(result['teknoloji']).toBe(2)
    expect(result['sanat']).toBe(1)
    expect(result['iş']).toBeUndefined()
  })

  it('returns empty object for empty input', () => {
    expect(buildCategoryCountMap([])).toEqual({})
  })
})
