import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function checkAuth() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth')
  return user
}
