-- 1 feedback per (user, idea). Owner can edit + delete.

SET search_path TO public;

-- Step 1: dedupe — keep newest feedback per (user, idea)
DELETE FROM public.feedbacks
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           row_number() OVER (PARTITION BY user_id, idea_id ORDER BY created_at DESC) AS rn
    FROM public.feedbacks
    WHERE user_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Step 2: unique constraint
ALTER TABLE public.feedbacks
  ADD CONSTRAINT feedbacks_user_idea_unique UNIQUE (user_id, idea_id);

-- Step 3: RLS — owner can update own feedback
CREATE POLICY "feedbacks_update_own" ON public.feedbacks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 4: RLS — owner can delete own feedback
CREATE POLICY "feedbacks_delete_own" ON public.feedbacks
  FOR DELETE
  USING (auth.uid() = user_id);
