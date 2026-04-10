import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { checkRateLimit } from './rate-limit'
import { createServerClient } from '@/lib/supabase/server'

describe('checkRateLimit', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns true (allowed) when under limit', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [{ count: 2 }], error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const result = await checkRateLimit('1.2.3.4', 'feedback', 3)
    expect(result).toBe(true)
  })

  it('returns false (blocked) when at or over limit', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [{ count: 3 }], error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const result = await checkRateLimit('1.2.3.4', 'feedback', 3)
    expect(result).toBe(false)
  })
})
