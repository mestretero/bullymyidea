-- Tighten RLS policies. Block anonymous users from creating content; require auth on reports;
-- restrict feedback edits to active ideas; require avatar uploads under user-owned path prefix.

SET search_path TO public;

-- ── IDEAS ────────────────────────────────────────────────────────────
-- Only registered (non-anonymous) users can post ideas.
DROP POLICY IF EXISTS "ideas_insert" ON public.ideas;
CREATE POLICY "ideas_insert" ON public.ideas
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) IS NOT TRUE
  );

-- ── VOTES ────────────────────────────────────────────────────────────
-- Only registered users can vote.
DROP POLICY IF EXISTS "votes_insert" ON public.votes;
CREATE POLICY "votes_insert" ON public.votes
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) IS NOT TRUE
  );

-- Owner can update their own vote (needed by upsert flow).
CREATE POLICY "votes_update_own" ON public.votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── REPORTS ──────────────────────────────────────────────────────────
-- Reports are now authenticated-only and per-user. Add a `reporter_user_id` column
-- and use it instead of the IP hash for ownership.
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT reports_reason_length CHECK (char_length(reason) <= 500) NOT VALID;

DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = reporter_user_id
  );

-- ── FEEDBACKS ────────────────────────────────────────────────────────
-- Feedback editing limited to feedbacks on still-active ideas.
DROP POLICY IF EXISTS "feedbacks_update_own" ON public.feedbacks;
CREATE POLICY "feedbacks_update_own" ON public.feedbacks
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.ideas i WHERE i.id = feedbacks.idea_id AND i.status = 'active'
    )
  )
  WITH CHECK (auth.uid() = user_id);

-- ── STORAGE ──────────────────────────────────────────────────────────
-- Avatar uploads must use the path prefix `avatars/{auth.uid()}-...`.
-- Idea media uploads remain free-form (one-time-use uploads tied to idea creation).
DROP POLICY IF EXISTS "registered can upload" ON storage.objects;
CREATE POLICY "registered can upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'idea-media'
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) IS NOT TRUE
    AND (
      -- Avatars: must be under avatars/<uid>-<rest>
      (split_part(name, '/', 1) = 'avatars'
        AND split_part(name, '/', 2) LIKE auth.uid()::text || '-%')
      -- Idea media: anywhere else under the bucket
      OR split_part(name, '/', 1) <> 'avatars'
    )
  );
