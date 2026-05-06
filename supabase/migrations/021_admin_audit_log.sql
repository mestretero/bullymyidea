-- Append-only audit log for admin destructive actions.
-- Service role only — admin actions through the API route are responsible
-- for writing entries.

SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,                  -- e.g. 'user_delete', 'idea_delete', 'feedback_delete', 'idea_archive', 'report_resolve'
  target_type text,                           -- 'user' | 'idea' | 'feedback' | 'report'
  target_id   uuid,                           -- the affected row id
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_idx ON public.admin_audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx ON public.admin_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_recent_idx ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log FORCE ROW LEVEL SECURITY;
-- No policies → only service_role bypasses RLS. Reads happen through admin
-- API routes that gate with `getAdminUser()`.
