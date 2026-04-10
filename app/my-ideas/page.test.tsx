import { describe, it, expect, vi } from 'vitest'

const mockRedirect = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))
vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))

import { createServerClient } from '@/lib/supabase/server'
import { checkAuth } from './page'

describe('checkAuth', () => {
  it('redirects to /auth when user is anonymous', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', is_anonymous: true } } }) },
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    await checkAuth()
    expect(mockRedirect).toHaveBeenCalledWith('/auth')
  })

  it('redirects to /auth when user is null', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    await checkAuth()
    expect(mockRedirect).toHaveBeenCalledWith('/auth')
  })
})
