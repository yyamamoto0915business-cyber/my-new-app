-- スタンプラリーのバッジを、ログイン中のアカウントへ一度だけ渡す

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS badge_awarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS badge_user_id UUID;

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL,
  label TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, game_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'user_badges_select_own'
  ) THEN
    CREATE POLICY "user_badges_select_own"
      ON public.user_badges FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.award_stamp_rally_badge(
  p_player_id uuid,
  p_user_id uuid,
  p_label text
) RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_awarded timestamptz;
  v_game uuid;
  v_label text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT game_id, badge_awarded_at
    INTO v_game, v_awarded
  FROM public.organizer_game_players
  WHERE id = p_player_id
  FOR UPDATE;

  IF v_game IS NULL THEN
    RETURN NULL;
  END IF;
  IF v_awarded IS NOT NULL THEN
    RETURN v_awarded;
  END IF;

  v_label := left(btrim(coalesce(p_label, '')), 40);
  IF v_label = '' THEN
    v_label := 'バッジ';
  END IF;

  INSERT INTO public.user_badges (user_id, game_id, label)
  VALUES (p_user_id, v_game, v_label)
  ON CONFLICT (user_id, game_id) DO NOTHING;

  UPDATE public.organizer_game_players
    SET badge_awarded_at = now(),
        badge_user_id = p_user_id
    WHERE id = p_player_id
  RETURNING badge_awarded_at INTO v_awarded;

  RETURN v_awarded;
END;
$$;

REVOKE ALL ON FUNCTION public.award_stamp_rally_badge(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_stamp_rally_badge(uuid, uuid, text) TO service_role;

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']
WHERE id = 'game-images';

NOTIFY pgrst, 'reload schema';
