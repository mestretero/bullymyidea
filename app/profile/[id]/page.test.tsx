import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@/lib/supabase/server'
import { buildProfileQuery } from '@/lib/build-profile-query'

describe('buildProfileQuery', () => {
  it('queries profiles by id', () => {
    const mockChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() }
    const mockSupabase = { from: vi.fn().mockReturnValue(mockChain) }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    buildProfileQuery('user-123')
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'user-123')
  })
})
