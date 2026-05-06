import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EditIdeaForm from '@/components/EditIdeaForm'

interface Props { params: { id: string } }

export default async function EditIdeaPage({ params }: Props) {
  const authClient = createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/auth')

  const supabase = createAdminClient()
  const { data: idea } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!idea) return notFound()
  if (idea.user_id !== user.id) redirect(`/idea/${params.id}`)

  return <EditIdeaForm idea={idea} />
}
