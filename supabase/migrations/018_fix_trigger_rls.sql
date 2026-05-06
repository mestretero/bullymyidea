-- 017 enabled FORCE ROW LEVEL SECURITY on notifications, which blocks even
-- SECURITY DEFINER triggers from inserting. We need to allow trigger inserts
-- without re-opening the table to direct PostgREST clients.
--
-- Approach: drop FORCE on notifications. The triggers run as DEFINER
-- (table owner = postgres role with BYPASSRLS), so without FORCE they can
-- insert. anon/authenticated still can't reach the table — no policies exist
-- and RLS is enabled.

SET search_path TO public;

ALTER TABLE public.notifications NO FORCE ROW LEVEL SECURITY;

-- Same fix for any other table whose triggers might insert into another
-- table (none today, but a safety net for future).
