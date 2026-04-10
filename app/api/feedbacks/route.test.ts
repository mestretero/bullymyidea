import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn().mockResolvedValue(true) }))

import { createServerClient } from '@/lib/supabase/server'

function makeRequest(body: object, ip = '1.2.3.4') {
  return new Request('http://localhost/api/feedbacks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

describe('POST /api/feedbacks', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when idea_id missing', async () => {
    const req = makeRequest({ strengths: 'test' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid input', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'fb-1' }, error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ idea_id: 'idea-1', strengths: 'Good', weaknesses: 'Bad', suggestions: 'Fix' })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ idea_id: 'idea-1', strengths: 'x', weaknesses: 'x', suggestions: 'x' })
    const res = await POST(req as any)
    expect(res.status).toBe(429)
  })
})
