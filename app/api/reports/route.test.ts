import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@/lib/supabase/server'

function makeRequest(body: object) {
  return new Request('http://localhost/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/reports', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when neither idea_id nor feedback_id provided', async () => {
    const req = makeRequest({ reason: 'spam' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 when both idea_id and feedback_id provided', async () => {
    const req = makeRequest({ idea_id: 'i1', feedback_id: 'f1', reason: 'spam' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 200 on valid idea report', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any)

    const req = makeRequest({ idea_id: 'idea-1', reason: 'uygunsuz içerik' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
  })
})
