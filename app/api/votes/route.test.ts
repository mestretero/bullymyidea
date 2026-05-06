import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@/lib/supabase/server'

function makeRequest(body: object) {
  return new Request('http://localhost/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/votes', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when feedback_id missing', async () => {
    const req = makeRequest({ vote_type: 'up' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid vote_type', async () => {
    const req = makeRequest({ feedback_id: 'fb-1', vote_type: 'sideways' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 200 on valid new vote', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ feedback_id: 'fb-1', vote_type: 'up' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
  })
})
