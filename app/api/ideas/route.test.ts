import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'

function makeRequest(body: object) {
  return new Request('http://localhost/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ideas', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when title is missing', async () => {
    const req = makeRequest({ description: 'test', category: 'technology' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid input', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'uid-1' } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'idea-1', title: 'Test' }, error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ title: 'Test', description: 'Description with enough chars', category: 'technology', tags: [] })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
  })
})
