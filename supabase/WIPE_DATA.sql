-- ───────────────────────────────────────────────────────────────────
--  WIPE ALL USER DATA — keep only boranaktas1846@gmail.com (admin).
--
--  Run in Supabase SQL editor when you want a clean slate.
--  Order matters: clear app tables FIRST, then delete other auth users
--  (cascade FKs handle the rest).
--
--  ⚠  This is irreversible. Take a Supabase snapshot first if unsure.
-- ───────────────────────────────────────────────────────────────────

SET search_path TO public;

-- 1) Drop all rows in app tables.
TRUNCATE TABLE
  public.admin_audit_log,
  public.notifications,
  public.bookmarks,
  public.votes,
  public.reports,
  public.feedbacks,
  public.ideas,
  public.rate_limits
RESTART IDENTITY CASCADE;

-- 2) Delete every auth.users row except the keeper.
--    profiles cascades automatically (FK ON DELETE CASCADE).
DELETE FROM auth.users
WHERE email IS DISTINCT FROM 'boranaktas1846@gmail.com';

-- 3) Make sure the keeper still owns the admin flag.
UPDATE public.profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'boranaktas1846@gmail.com');

-- ───────────────────────────────────────────────────────────────────
--  STORAGE — Postgres SQL can't delete bucket files. Use ONE of:
--
--   a) Supabase Dashboard → Storage → idea-media → select all → delete
--   b) supabase-cli:  supabase storage rm 'ss:///idea-media/**'
--   c) Run this snippet from a Node script with the service-role key:
--
--      const { data: list } = await admin.storage.from('idea-media').list('', { limit: 1000 })
--      const paths = list.map(o => o.name)
--      await admin.storage.from('idea-media').remove(paths)
--
--  Avatar files for the keeper start with `avatars/<keeper-uid>-` —
--  delete those too if you want a fully clean account.
-- ───────────────────────────────────────────────────────────────────
