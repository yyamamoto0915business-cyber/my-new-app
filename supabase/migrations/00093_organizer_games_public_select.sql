-- 公開中のゲームはまちの情報から読めるようにする

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_games'
      AND policyname = 'organizer_games_select_published'
  ) THEN
    CREATE POLICY "organizer_games_select_published"
      ON public.organizer_games FOR SELECT
      TO anon, authenticated
      USING (status = 'published');
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
