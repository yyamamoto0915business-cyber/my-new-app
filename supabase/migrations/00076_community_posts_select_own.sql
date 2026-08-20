-- 本人は自分の投稿を status を問わず読める（下書き・非公開の取得・再開に必要）
-- 既存の community_posts_select_public は status = 'public' のみ許可のため、
-- マイページ／下書き一覧／下書き再開では本人の draft/hidden が RLS で弾かれていた。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_posts'
      AND policyname = 'community_posts_select_own'
  ) THEN
    CREATE POLICY "community_posts_select_own"
      ON public.community_posts FOR SELECT
      TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
