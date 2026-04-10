import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockServerClient } from './mock-server'

export function createServerClient() {
  // Use mock data when NEXT_PUBLIC_SUPABASE_URL is not configured
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url === 'your_supabase_project_url' || process.env.USE_MOCK_DATA === 'true') {
    return createMockServerClient() as any
  }

  const cookieStore = cookies()
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
