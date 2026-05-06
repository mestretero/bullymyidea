import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Returns the authenticated user if they are flagged as admin in `profiles`.
// Returns null otherwise. Use as the gate at the top of every admin-only API
// route or admin-only server component.
export async function getAdminUser() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_admin) return null
  return user
}
