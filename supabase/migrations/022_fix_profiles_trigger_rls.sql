-- 017 enabled FORCE ROW LEVEL SECURITY on profiles, which blocks even the
-- auth-signup trigger (`handle_new_user` from migration 005). Result: new
-- registrations get an auth.users row but no profiles row → /profile/me
-- 404s, navbar profile link broken.
--
-- Fix: drop FORCE on profiles. Anon and authenticated PostgREST roles still
-- cannot reach profiles directly because no policies exist — service_role
-- is the only path in.

SET search_path TO public;

ALTER TABLE public.profiles NO FORCE ROW LEVEL SECURITY;

-- Harden trigger function search_path — only if it exists. Older databases
-- may not have it (migration 005 not yet run, or function under a different
-- schema/signature).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_catalog';
  END IF;
END $$;

-- Backfill any auth.users without a profiles row (signups made between when
-- 017 deployed and this fix shipped).
INSERT INTO public.profiles (id, username)
SELECT
  u.id,
  COALESCE(
    NULLIF(regexp_replace(lower(coalesce(u.raw_user_meta_data->>'username','')), '[^a-z0-9_]', '', 'g'), ''),
    NULLIF(regexp_replace(lower(split_part(coalesce(u.email,''), '@', 1)), '[^a-z0-9_]', '', 'g'), ''),
    'user_' || substring(u.id::text, 1, 8)
  )
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
