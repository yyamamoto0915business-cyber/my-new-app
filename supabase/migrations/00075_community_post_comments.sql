-- みんなの投稿のコメント
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_display_name TEXT NOT NULL,
  body TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'public'
    CHECK (status IN ('public', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_post_comments_post_created
  ON public.community_post_comments (post_id, created_at DESC);

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_comments'
      AND policyname = 'community_post_comments_select_public'
  ) THEN
    CREATE POLICY "community_post_comments_select_public"
      ON public.community_post_comments FOR SELECT
      USING (status = 'public');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_comments'
      AND policyname = 'community_post_comments_insert_auth'
  ) THEN
    CREATE POLICY "community_post_comments_insert_auth"
      ON public.community_post_comments FOR INSERT
      TO authenticated
      WITH CHECK (
        author_id IS NULL OR author_id = auth.uid()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_comments'
      AND policyname = 'community_post_comments_update_own'
  ) THEN
    CREATE POLICY "community_post_comments_update_own"
      ON public.community_post_comments FOR UPDATE
      TO authenticated
      USING (author_id = auth.uid())
      WITH CHECK (author_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_comments'
      AND policyname = 'community_post_comments_delete_own'
  ) THEN
    CREATE POLICY "community_post_comments_delete_own"
      ON public.community_post_comments FOR DELETE
      TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;

-- コメント数を community_posts.comment_count に同期する
CREATE OR REPLACE FUNCTION public.sync_community_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
      SET comment_count = comment_count + 1
      WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_community_post_comment_count
  ON public.community_post_comments;
CREATE TRIGGER trg_sync_community_post_comment_count
  AFTER INSERT OR DELETE ON public.community_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_community_post_comment_count();
