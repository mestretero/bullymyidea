-- Fix UPDATE policy: allow owner to edit any field of their idea (not just archive).
-- Add DELETE policy for hard delete.

DROP POLICY IF EXISTS "ideas_update_own" ON ideas;

CREATE POLICY "ideas_update_own" ON ideas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ideas_delete_own" ON ideas
  FOR DELETE
  USING (auth.uid() = user_id);
