-- ─────────────────────────────────────────────────────────────────────
--  Lock RLS to deny ALL direct PostgREST access.
--  Only the service_role (used server-side from Next.js) bypasses RLS.
--  Anon and authenticated roles get nothing direct — every query goes
--  through our /api routes.
-- ─────────────────────────────────────────────────────────────────────

SET search_path TO public;

-- Drop every existing policy on application tables.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('ideas','feedbacks','votes','reports','rate_limits','profiles','notifications','bookmarks')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Make sure RLS is enabled on all of them. With no policies, everything is
-- denied for anon and authenticated roles. service_role bypasses RLS.
ALTER TABLE public.ideas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks     ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (defence in depth — service_role is the only bypass).
ALTER TABLE public.ideas         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.votes         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reports       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks     FORCE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────
--  Storage: lock the bucket too. Only authenticated paths matter for
--  uploads through our app; public reads still work via the public URL
--  (Supabase short-circuits public-bucket reads outside RLS), but we
--  drop the listable SELECT policy so the bucket can no longer be
--  enumerated via storage.list().
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "registered can upload" ON storage.objects;
DROP POLICY IF EXISTS "public can read"       ON storage.objects;
DROP POLICY IF EXISTS "owner can delete"      ON storage.objects;

-- All storage operations now go through service_role from server code.
-- Public file fetch via the bucket's public URL still works because
-- Supabase storage serves public buckets without consulting RLS for the
-- /storage/v1/object/public/<bucket>/<path> path. List/REST operations
-- are blocked.

-- Make sure the bucket itself is still flagged public (for direct fetch).
UPDATE storage.buckets SET public = true WHERE id = 'idea-media';

-- ─────────────────────────────────────────────────────────────────────
--  Hardening: lock down SECURITY DEFINER functions' search_path so they
--  can't be hijacked via search_path manipulation.
-- ─────────────────────────────────────────────────────────────────────

ALTER FUNCTION public.notify_feedback_on_idea() SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_vote_on_feedback() SET search_path = public, pg_catalog;
