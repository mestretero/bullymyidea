import { createServerClient } from '@/lib/supabase/server'

export function buildProfileQuery(userId: string) {
  const supabase = createServerClient()
  return supabase.from('profiles').select('*').eq('id', userId).single()
}
