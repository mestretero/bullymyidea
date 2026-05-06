import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function MyProfilePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.is_anonymous) redirect('/auth')
  redirect(`/profile/${user.id}`)
}
