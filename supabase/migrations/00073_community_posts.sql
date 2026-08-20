-- みんなの投稿（15秒動画中心）
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_display_name TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('event', 'shop', 'spot', 'kitchen', 'scenery')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  area_label TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'video'
    CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  poster_url TEXT,
  duration_sec REAL,
  status TEXT NOT NULL DEFAULT 'public'
    CHECK (status IN ('draft', 'public', 'hidden')),
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_status_created
  ON public.community_posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category
  ON public.community_posts (category);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_posts'
      AND policyname = 'community_posts_select_public'
  ) THEN
    CREATE POLICY "community_posts_select_public"
      ON public.community_posts FOR SELECT
      USING (status = 'public');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_posts'
      AND policyname = 'community_posts_insert_auth'
  ) THEN
    CREATE POLICY "community_posts_insert_auth"
      ON public.community_posts FOR INSERT
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
      AND tablename = 'community_posts'
      AND policyname = 'community_posts_update_own'
  ) THEN
    CREATE POLICY "community_posts_update_own"
      ON public.community_posts FOR UPDATE
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
      AND tablename = 'community_posts'
      AND policyname = 'community_posts_delete_own'
  ) THEN
    CREATE POLICY "community_posts_delete_own"
      ON public.community_posts FOR DELETE
      TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;
