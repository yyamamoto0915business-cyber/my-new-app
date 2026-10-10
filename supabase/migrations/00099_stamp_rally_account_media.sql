-- 参加回数をアカウント単位にし、バッジの絵と長めの動画を置けるようにする

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS account_user_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS organizer_game_players_account_game
  ON public.organizer_game_players (game_id, account_user_id)
  WHERE account_user_id IS NOT NULL;

ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

DROP FUNCTION IF EXISTS public.award_stamp_rally_badge(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.award_stamp_rally_badge(
  p_player_id uuid,
  p_user_id uuid,
  p_label text,
  p_image text DEFAULT ''
) RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_awarded timestamptz;
  v_game uuid;
  v_label text;
  v_image text;
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
  v_image := left(btrim(coalesce(p_image, '')), 500);

  INSERT INTO public.user_badges (user_id, game_id, label, image_url)
  VALUES (p_user_id, v_game, v_label, v_image)
  ON CONFLICT (user_id, game_id) DO UPDATE
    SET image_url = CASE
      WHEN public.user_badges.image_url = '' THEN EXCLUDED.image_url
      ELSE public.user_badges.image_url
    END;

  UPDATE public.organizer_game_players
    SET badge_awarded_at = now(),
        badge_user_id = p_user_id
    WHERE id = p_player_id
  RETURNING badge_awarded_at INTO v_awarded;

  RETURN v_awarded;
END;
$$;

REVOKE ALL ON FUNCTION public.award_stamp_rally_badge(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_stamp_rally_badge(uuid, uuid, text, text) TO service_role;

UPDATE storage.buckets
SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'image/jpeg','image/png','image/webp',
    'video/mp4','video/webm','video/quicktime',
    'audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/aac'
  ]
WHERE id = 'game-images';

NOTIFY pgrst, 'reload schema';
