-- Notification system: someone critiques/votes on your idea -> you get notified.
-- Triggers fire after feedback insert and vote insert.

SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type        text NOT NULL CHECK (type IN ('feedback_received', 'vote_received')),
  idea_id     uuid REFERENCES public.ideas(id) ON DELETE CASCADE,
  feedback_id uuid REFERENCES public.feedbacks(id) ON DELETE CASCADE,
  metadata    jsonb DEFAULT '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS notifications_user_recent_idx
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger: feedback insert -> notify idea owner (if not self)
CREATE OR REPLACE FUNCTION public.notify_feedback_on_idea()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.ideas WHERE id = NEW.idea_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, idea_id, feedback_id)
    VALUES (owner_id, NEW.user_id, 'feedback_received', NEW.idea_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_feedback_on_idea ON public.feedbacks;
CREATE TRIGGER notify_feedback_on_idea
  AFTER INSERT ON public.feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.notify_feedback_on_idea();

-- Trigger: vote insert -> notify feedback owner (if not self)
CREATE OR REPLACE FUNCTION public.notify_vote_on_feedback()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  fb_owner uuid;
  fb_idea  uuid;
BEGIN
  SELECT user_id, idea_id INTO fb_owner, fb_idea FROM public.feedbacks WHERE id = NEW.feedback_id;
  IF fb_owner IS NOT NULL AND fb_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, idea_id, feedback_id, metadata)
    VALUES (fb_owner, NEW.user_id, 'vote_received', fb_idea, NEW.feedback_id, jsonb_build_object('vote_type', NEW.vote_type));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_vote_on_feedback ON public.votes;
CREATE TRIGGER notify_vote_on_feedback
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.notify_vote_on_feedback();
