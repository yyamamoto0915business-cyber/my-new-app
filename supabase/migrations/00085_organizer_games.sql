-- MachiGlyph: 主催者ゲーム機能（スタンプラリー等）の下書きハブ

CREATE TABLE IF NOT EXISTS public.organizer_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,

  type TEXT NOT NULL DEFAULT 'stamp'
    CHECK (type IN ('stamp', 'quiz', 'mystery', 'mission', 'photo', 'coupon', 'checkin')),
  name TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizer_games_organizer_id
  ON public.organizer_games (organizer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizer_games_event_id
  ON public.organizer_games (event_id);

ALTER TABLE public.organizer_games ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_games'
      AND policyname = 'organizer_games_select_own'
  ) THEN
    CREATE POLICY "organizer_games_select_own"
      ON public.organizer_games FOR SELECT TO authenticated
      USING (
        organizer_id IN (
          SELECT id FROM public.organizers WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_games'
      AND policyname = 'organizer_games_insert_own'
  ) THEN
    CREATE POLICY "organizer_games_insert_own"
      ON public.organizer_games FOR INSERT TO authenticated
      WITH CHECK (
        organizer_id IN (
          SELECT id FROM public.organizers WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_games'
      AND policyname = 'organizer_games_update_own'
  ) THEN
    CREATE POLICY "organizer_games_update_own"
      ON public.organizer_games FOR UPDATE TO authenticated
      USING (
        organizer_id IN (
          SELECT id FROM public.organizers WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_games'
      AND policyname = 'organizer_games_delete_own'
  ) THEN
    CREATE POLICY "organizer_games_delete_own"
      ON public.organizer_games FOR DELETE TO authenticated
      USING (
        organizer_id IN (
          SELECT id FROM public.organizers WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'set_updated_at' AND pronamespace = 'public'::regnamespace
  ) THEN
    DROP TRIGGER IF EXISTS trg_organizer_games_updated_at ON public.organizer_games;
    CREATE TRIGGER trg_organizer_games_updated_at
      BEFORE UPDATE ON public.organizer_games
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
