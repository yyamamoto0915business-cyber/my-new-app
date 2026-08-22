-- ユーザー間フォロー（承認制）と、フォロー申請通知

CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_follows_no_self CHECK (follower_id <> followee_id),
  CONSTRAINT user_follows_unique_pair UNIQUE (follower_id, followee_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_followee_status
  ON public.user_follows (followee_id, status);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_status
  ON public.user_follows (follower_id, status);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_follows'
      AND policyname = 'user_follows_select_involved'
  ) THEN
    CREATE POLICY "user_follows_select_involved"
      ON public.user_follows FOR SELECT
      TO authenticated
      USING (follower_id = auth.uid() OR followee_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_follows'
      AND policyname = 'user_follows_insert_own'
  ) THEN
    CREATE POLICY "user_follows_insert_own"
      ON public.user_follows FOR INSERT
      TO authenticated
      WITH CHECK (follower_id = auth.uid() AND status = 'pending');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_follows'
      AND policyname = 'user_follows_update_followee'
  ) THEN
    CREATE POLICY "user_follows_update_followee"
      ON public.user_follows FOR UPDATE
      TO authenticated
      USING (followee_id = auth.uid())
      WITH CHECK (followee_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_follows'
      AND policyname = 'user_follows_delete_follower'
  ) THEN
    CREATE POLICY "user_follows_delete_follower"
      ON public.user_follows FOR DELETE
      TO authenticated
      USING (follower_id = auth.uid());
  END IF;
END $$;

-- 承認済みフォロワーは相手の非公開投稿を読める
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_posts'
      AND policyname = 'community_posts_select_followers_hidden'
  ) THEN
    CREATE POLICY "community_posts_select_followers_hidden"
      ON public.community_posts FOR SELECT
      TO authenticated
      USING (
        status = 'hidden'
        AND EXISTS (
          SELECT 1
          FROM public.user_follows f
          WHERE f.followee_id = community_posts.author_id
            AND f.follower_id = auth.uid()
            AND f.status = 'accepted'
        )
      );
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
    'follow_accepted'
  ));

NOTIFY pgrst, 'reload schema';
