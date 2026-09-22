-- MachiGlyph: ゲームの参加QR・スポットQR

ALTER TABLE public.organizer_games
  ADD COLUMN IF NOT EXISTS join_token TEXT;

UPDATE public.organizer_games
SET join_token = substring(replace(gen_random_uuid()::text, '-', '') from 1 for 20)
WHERE join_token IS NULL OR btrim(join_token) = '';

ALTER TABLE public.organizer_games
  ALTER COLUMN join_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS organizer_games_join_token_key
  ON public.organizer_games (join_token);

CREATE TABLE IF NOT EXISTS public.organizer_game_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.organizer_games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'stamp'
    CHECK (kind IN ('stamp', 'goal')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS organizer_game_spots_token_key
  ON public.organizer_game_spots (token);
CREATE INDEX IF NOT EXISTS idx_organizer_game_spots_game_id
  ON public.organizer_game_spots (game_id, sort_order);

ALTER TABLE public.organizer_game_spots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_game_spots'
      AND policyname = 'organizer_game_spots_select_own'
  ) THEN
    CREATE POLICY "organizer_game_spots_select_own"
      ON public.organizer_game_spots FOR SELECT TO authenticated
      USING (
        game_id IN (
          SELECT g.id FROM public.organizer_games g
          WHERE g.organizer_id IN (
            SELECT id FROM public.organizers WHERE profile_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_game_spots'
      AND policyname = 'organizer_game_spots_insert_own'
  ) THEN
    CREATE POLICY "organizer_game_spots_insert_own"
      ON public.organizer_game_spots FOR INSERT TO authenticated
      WITH CHECK (
        game_id IN (
          SELECT g.id FROM public.organizer_games g
          WHERE g.organizer_id IN (
            SELECT id FROM public.organizers WHERE profile_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_game_spots'
      AND policyname = 'organizer_game_spots_update_own'
  ) THEN
    CREATE POLICY "organizer_game_spots_update_own"
      ON public.organizer_game_spots FOR UPDATE TO authenticated
      USING (
        game_id IN (
          SELECT g.id FROM public.organizer_games g
          WHERE g.organizer_id IN (
            SELECT id FROM public.organizers WHERE profile_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_game_spots'
      AND policyname = 'organizer_game_spots_delete_own'
  ) THEN
    CREATE POLICY "organizer_game_spots_delete_own"
      ON public.organizer_game_spots FOR DELETE TO authenticated
      USING (
        game_id IN (
          SELECT g.id FROM public.organizer_games g
          WHERE g.organizer_id IN (
            SELECT id FROM public.organizers WHERE profile_id = auth.uid()
          )
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
    DROP TRIGGER IF EXISTS trg_organizer_game_spots_updated_at ON public.organizer_game_spots;
    CREATE TRIGGER trg_organizer_game_spots_updated_at
      BEFORE UPDATE ON public.organizer_game_spots
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_play_game_by_join_token(p_token text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  type text,
  starts_at timestamptz,
  ends_at timestamptz,
  spot_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.name,
    g.description,
    g.type,
    g.starts_at,
    g.ends_at,
    (
      SELECT count(*)::integer
      FROM public.organizer_game_spots s
      WHERE s.game_id = g.id
    ) AS spot_count
  FROM public.organizer_games g
  WHERE g.join_token = p_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_play_spot_by_token(p_token text)
RETURNS TABLE (
  spot_id uuid,
  spot_name text,
  spot_kind text,
  game_id uuid,
  game_name text,
  game_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.kind,
    g.id,
    g.name,
    g.type
  FROM public.organizer_game_spots s
  INNER JOIN public.organizer_games g ON g.id = s.game_id
  WHERE s.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_play_game_by_join_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_play_spot_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_play_game_by_join_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_play_spot_by_token(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
