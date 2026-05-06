import { createAdminClient } from '@/lib/supabase/admin'

export type AuditAction =
  | 'user_delete'
  | 'idea_archive'
  | 'idea_delete'
  | 'feedback_delete'
  | 'report_resolve'

export type AuditTarget = 'user' | 'idea' | 'feedback' | 'report'

interface LogParams {
  adminId: string
  action: AuditAction
  targetType: AuditTarget
  targetId: string | null
  metadata?: Record<string, unknown>
}

export async function logAdminAction(params: LogParams): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('admin_audit_log').insert({
    admin_id: params.adminId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    metadata: params.metadata ?? {},
  })
  if (error) {
    console.error('admin audit log insert failed:', error, params)
  }
}
