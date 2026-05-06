-- Per-idea view counter for founder analytics.

SET search_path TO public;

ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ideas_view_count_idx ON public.ideas(view_count DESC);

-- Atomic increment helper. Service role calls this from the API route.
CREATE OR REPLACE FUNCTION public.increment_idea_view(idea_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.ideas SET view_count = view_count + 1 WHERE id = idea_uuid;
END;
$$;
