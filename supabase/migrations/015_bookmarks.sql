-- Bookmarks: registered users can save ideas to read later

SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id    uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idea_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_idx ON public.bookmarks(user_id, created_at DESC);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_own" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_own" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_own" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);
