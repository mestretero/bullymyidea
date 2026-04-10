import { MOCK_IDEAS, MOCK_FEEDBACKS, MOCK_PROFILES } from '@/lib/mock-data'

function createMockQueryBuilder(table: string) {
  const filters: Record<string, any> = {}
  let _limit: number | undefined
  let _useSingle = false
  let _selectCols = ''

  const builder: any = {
    select(cols: string) { _selectCols = cols; return builder },
    eq(col: string, val: any) { filters[col] = val; return builder },
    order() { return builder },
    limit(n: number) { _limit = n; return builder },
    lt() { return builder },
    gte() { return builder },
    single() { _useSingle = true; return execute() },
    then(resolve: any, reject: any) { return execute().then(resolve, reject) },
  }

  function execute(): Promise<{ data: any; error: any }> {
    let data: any[] = []

    if (table === 'ideas') {
      data = MOCK_IDEAS.map(idea => ({
        ...idea,
        // Add feedback_count aggregate if select includes feedbacks
        feedback_count: _selectCols.includes('feedbacks')
          ? [{ count: MOCK_FEEDBACKS.filter(f => f.idea_id === idea.id).length }]
          : undefined,
      }))
      if (filters['status']) data = data.filter(i => i.status === filters['status'])
      if (filters['category']) data = data.filter(i => i.category === filters['category'])
      if (filters['user_id']) data = data.filter(i => i.user_id === filters['user_id'])
      if (filters['id']) data = data.filter(i => i.id === filters['id'])
    }

    if (table === 'feedbacks') {
      data = MOCK_FEEDBACKS.map(fb => ({
        ...fb,
        // Add votes array if select includes votes
        votes: _selectCols.includes('votes')
          ? [
              ...Array(fb.vote_counts?.up ?? 0).fill({ vote_type: 'up' }),
              ...Array(fb.vote_counts?.down ?? 0).fill({ vote_type: 'down' }),
            ]
          : undefined,
      }))
      if (filters['idea_id']) data = data.filter(f => f.idea_id === filters['idea_id'])
    }

    if (table === 'profiles') {
      data = MOCK_PROFILES
      if (filters['id']) data = data.filter(p => p.id === filters['id'])
    }

    if (table === 'rate_limits') {
      data = [{ count: 0 }] // always under limit
    }

    if (_limit) data = data.slice(0, _limit)

    if (_useSingle) {
      return Promise.resolve({
        data: data[0] ?? null,
        error: data[0] ? null : { message: 'Not found', code: 'PGRST116' },
      })
    }

    return Promise.resolve({ data, error: null })
  }

  return builder
}

export function createMockServerClient() {
  return {
    from: (table: string) => createMockQueryBuilder(table),
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'user-1', is_anonymous: false, email: 'ahmet@example.com' } },
        error: null,
      }),
      getSession: () => Promise.resolve({
        data: { session: { user: { id: 'user-1', is_anonymous: false } } },
        error: null,
      }),
      exchangeCodeForSession: () => Promise.resolve({ data: {}, error: null }),
    },
  }
}
