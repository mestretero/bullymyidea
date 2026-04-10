import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { buildIdeasQuery } from './page'
import { createServerClient } from '@/lib/supabase/server'

describe('buildIdeasQuery', () => {
  it('filters by category when provided', () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }
    const mockSupabase = { from: vi.fn().mockReturnValue(mockQuery) }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    buildIdeasQuery('teknoloji')
    expect(mockQuery.eq).toHaveBeenCalledWith('category', 'teknoloji')
  })

  it('does not filter when category is undefined', () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }
    const mockSupabase = { from: vi.fn().mockReturnValue(mockQuery) }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    buildIdeasQuery(undefined)
    // eq should only have been called with 'status', not 'category'
    expect(mockQuery.eq).not.toHaveBeenCalledWith('category', expect.anything())
  })
})
