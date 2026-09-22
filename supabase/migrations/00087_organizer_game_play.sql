-- MachiGlyph: ゲーム参加（ニックネーム＋合言葉）とスタンプ

ALTER TABLE public.organizer_games
  ADD COLUMN IF NOT EXISTS play_epoch INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.organizer_game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.organizer_games(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  nickname_key TEXT NOT NULL,
  passphrase_salt TEXT NOT NULL,
  passphrase_hash TEXT NOT NULL,
  device_token_hash TEXT NOT NULL,
  auth_epoch INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, nickname_key)
);

CREATE INDEX IF NOT EXISTS idx_organizer_game_players_game_id
  ON public.organizer_game_players (game_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizer_game_players_device
  ON public.organizer_game_players (device_token_hash);

CREATE TABLE IF NOT EXISTS public.organizer_game_stamps (
  player_id UUID NOT NULL REFERENCES public.organizer_game_players(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.organizer_game_spots(id) ON DELETE CASCADE,
  stamped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, spot_id)
);

CREATE INDEX IF NOT EXISTS idx_organizer_game_stamps_spot
  ON public.organizer_game_stamps (spot_id);

ALTER TABLE public.organizer_game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_game_stamps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizer_game_players'
      AND policyname = 'organizer_game_players_select_own'
  ) THEN
    CREATE POLICY "organizer_game_players_select_own"
      ON public.organizer_game_players FOR SELECT TO authenticated
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
    WHERE schemaname = 'public' AND tablename = 'organizer_game_stamps'
      AND policyname = 'organizer_game_stamps_select_own'
  ) THEN
    CREATE POLICY "organizer_game_stamps_select_own"
      ON public.organizer_game_stamps FOR SELECT TO authenticated
      USING (
        player_id IN (
          SELECT p.id FROM public.organizer_game_players p
          WHERE p.game_id IN (
            SELECT g.id FROM public.organizer_games g
            WHERE g.organizer_id IN (
              SELECT id FROM public.organizers WHERE profile_id = auth.uid()
            )
          )
        )
      );
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_play_spot_by_token(text);

CREATE OR REPLACE FUNCTION public.get_play_spot_by_token(p_token text)
RETURNS TABLE (
  spot_id uuid,
  spot_name text,
  spot_kind text,
  game_id uuid,
  game_name text,
  game_type text,
  join_token text
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
    g.type,
    g.join_token
  FROM public.organizer_game_spots s
  INNER JOIN public.organizer_games g ON g.id = s.game_id
  WHERE s.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_play_spot_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_play_spot_by_token(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
