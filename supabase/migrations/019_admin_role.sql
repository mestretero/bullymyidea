-- Admin role flag + indices for the reports queue.

SET search_path TO public;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Status of a report: open (pending review) / resolved (acted on or dismissed).
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved')),
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_note text;

CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status, created_at DESC);

-- Seed: grant admin to the project owner. No-op if the account doesn't exist yet
-- (in that case, run the UPDATE manually after first sign-up).
UPDATE public.profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'boranaktas1846@gmail.com'
);
