-- 投稿いいねと、いいね通知

CREATE TABLE IF NOT EXISTS public.community_post_likes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_user
  ON public.community_post_likes (user_id, created_at DESC);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_likes'
      AND policyname = 'community_post_likes_select_own'
  ) THEN
    CREATE POLICY "community_post_likes_select_own"
      ON public.community_post_likes FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_likes'
      AND policyname = 'community_post_likes_insert_own'
  ) THEN
    CREATE POLICY "community_post_likes_insert_own"
      ON public.community_post_likes FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_likes'
      AND policyname = 'community_post_likes_delete_own'
  ) THEN
    CREATE POLICY "community_post_likes_delete_own"
      ON public.community_post_likes FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_message',
    'system_message',
    'participation_confirmed',
    'status_updated',
    'other',
    'follow_request',
    'follow_accepted',
    'post_like'
  ));

NOTIFY pgrst, 'reload schema';
