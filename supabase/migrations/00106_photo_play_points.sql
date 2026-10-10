-- フォトラリーのクリアポイントを、ログイン中のアカウントへ一度だけ加算する

CREATE OR REPLACE FUNCTION public.award_play_points(
  p_player_id uuid,
  p_user_id uuid,
  p_amount integer,
  p_source text
) RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_awarded timestamptz;
  v_game uuid;
  v_ref text;
BEGIN
  IF p_user_id IS NULL OR p_amount < 1 OR p_amount > 9999 THEN
    RETURN NULL;
  END IF;
  IF p_source NOT IN ('photo', 'checkin') THEN
    RETURN NULL;
  END IF;

  SELECT game_id, points_awarded_at
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

  v_ref := p_source || ':' || v_game::text || ':' || p_player_id::text;

  INSERT INTO public.user_points (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_points.balance + EXCLUDED.balance,
        updated_at = now();

  INSERT INTO public.point_transactions (user_id, amount, type, reference_id)
  VALUES (p_user_id, p_amount, 'earn', v_ref);

  UPDATE public.organizer_game_players
    SET points_awarded_at = now(),
        points_user_id = p_user_id
    WHERE id = p_player_id
  RETURNING points_awarded_at INTO v_awarded;

  RETURN v_awarded;
END;
$$;

REVOKE ALL ON FUNCTION public.award_play_points(uuid, uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_play_points(uuid, uuid, integer, text) TO service_role;

NOTIFY pgrst, 'reload schema';
