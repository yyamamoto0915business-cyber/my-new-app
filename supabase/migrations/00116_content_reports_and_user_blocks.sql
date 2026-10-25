-- 通報とブロック（App Store 審査ガイドライン 1.2：ユーザー投稿のあるアプリに必須）

-- 通報：投稿・コメント・ユーザーを運営に知らせる
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL
    CHECK (target_type IN ('post', 'comment', 'user')),
  target_id TEXT NOT NULL,
  -- 通報された内容を書いた人（ユーザー通報ならその人）
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL
    CHECK (reason IN ('spam', 'harassment', 'sexual', 'violence', 'privacy', 'other')),
  detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'hidden', 'dismissed')),
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status_created
  ON public.content_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter
  ON public.content_reports (reporter_id, target_type);

-- 同じ人が同じものを何度も通報しても1件にする
CREATE UNIQUE INDEX IF NOT EXISTS content_reports_once_per_reporter
  ON public.content_reports (reporter_id, target_type, target_id);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_reports'
      AND policyname = 'content_reports_insert_own'
  ) THEN
    CREATE POLICY "content_reports_insert_own"
      ON public.content_reports FOR INSERT
      TO authenticated
      WITH CHECK (reporter_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'content_reports'
      AND policyname = 'content_reports_select_own'
  ) THEN
    CREATE POLICY "content_reports_select_own"
      ON public.content_reports FOR SELECT
      TO authenticated
      USING (reporter_id = auth.uid());
  END IF;
END $$;

-- ブロック：ブロックした人・された人の投稿とコメントをお互いに見えなくする
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
  ON public.user_blocks (blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_blocks'
      AND policyname = 'user_blocks_own'
  ) THEN
    CREATE POLICY "user_blocks_own"
      ON public.user_blocks FOR ALL
      TO authenticated
      USING (blocker_id = auth.uid())
      WITH CHECK (blocker_id = auth.uid());
  END IF;
END $$;
