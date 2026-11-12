-- イベントポイント：イベントが発行して、そのイベントの開催中に、そのイベントのレジで使えるポイント。
-- ためる：そのイベントにつながったゲーム（スタンプラリー・フォトラリー・チェックイン・ミッション）をクリアしたとき
--         point_transactions.reference_id = '<種類>:<ゲームID>:<プレイヤーID>'（今までどおり）
-- 使う  ：レジで参加パスを読み取って、商品と交換（あとで割引も）
--         point_transactions.reference_id = 'event:<イベントID>:<会計のID など>'（type = 'spend'、amount はマイナス）
-- 残高はイベントごとに、この2つの合計で数える（lib/points/event-points.ts と同じ数え方）。

-- 1) イベントごとのポイントの使い方（主催者が決める）
CREATE TABLE IF NOT EXISTS public.event_point_settings (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  -- off：使わない（記録だけ） / exchange：商品と交換 / discount：会計の割引（あとで作る）
  mode TEXT NOT NULL DEFAULT 'off' CHECK (mode IN ('off', 'exchange', 'discount')),
  yen_per_point INTEGER NOT NULL DEFAULT 1 CHECK (yen_per_point BETWEEN 1 AND 100),
  discount_max_yen INTEGER CHECK (discount_max_yen IS NULL OR discount_max_yen >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.event_point_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_point_settings'
      AND policyname = 'event_point_settings_select_own'
  ) THEN
    CREATE POLICY "event_point_settings_select_own"
      ON public.event_point_settings FOR SELECT TO authenticated
      USING (organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_point_settings'
      AND policyname = 'event_point_settings_insert_own'
  ) THEN
    CREATE POLICY "event_point_settings_insert_own"
      ON public.event_point_settings FOR INSERT TO authenticated
      WITH CHECK (
        organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
        AND event_id IN (
          SELECT e.id FROM public.events e
          JOIN public.organizers o ON o.id = e.organizer_id
          WHERE o.profile_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_point_settings'
      AND policyname = 'event_point_settings_update_own'
  ) THEN
    CREATE POLICY "event_point_settings_update_own"
      ON public.event_point_settings FOR UPDATE TO authenticated
      USING (organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid()))
      WITH CHECK (organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid()));
  END IF;
END $$;

-- 2) レジの商品に「何ptで交換できるか」（null：交換しない）
ALTER TABLE public.pos_products
  ADD COLUMN IF NOT EXISTS point_price INTEGER CHECK (point_price IS NULL OR point_price > 0);

-- 3) 会計でポイントを使った記録
ALTER TABLE public.pos_sales
  ADD COLUMN IF NOT EXISTS points_used INTEGER NOT NULL DEFAULT 0 CHECK (points_used >= 0),
  ADD COLUMN IF NOT EXISTS points_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.pos_sale_items
  ADD COLUMN IF NOT EXISTS points_used INTEGER NOT NULL DEFAULT 0 CHECK (points_used >= 0);

-- 4) ある人の、あるイベントのポイントの残り
CREATE OR REPLACE FUNCTION public.event_points_balance(p_user_id UUID, p_event_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    COALESCE((
      SELECT SUM(t.amount)
      FROM public.point_transactions t
      JOIN public.organizer_games g ON g.id::text = split_part(t.reference_id, ':', 2)
      WHERE t.user_id = p_user_id
        AND split_part(t.reference_id, ':', 1) IN ('stamp-rally', 'photo', 'checkin', 'mission')
        AND g.event_id = p_event_id
    ), 0)
    + COALESCE((
      SELECT SUM(t.amount)
      FROM public.point_transactions t
      WHERE t.user_id = p_user_id
        AND t.reference_id LIKE 'event:' || p_event_id::text || ':%'
    ), 0)
  )::INTEGER;
$$;

-- 5) ポイントを使う。同じ人・同じイベントは一度に1つずつ処理し、残りが足りなければ止める。
--    同じ p_ref（会計のIDなど）で2回呼ばれても、二重には引かない。戻り値は使ったあとの残り。
CREATE OR REPLACE FUNCTION public.redeem_event_points(
  p_user_id UUID,
  p_event_id UUID,
  p_amount INTEGER,
  p_ref TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT := 'event:' || p_event_id::text || ':' || p_ref;
  v_balance INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  IF p_ref IS NULL OR length(p_ref) = 0 THEN
    RAISE EXCEPTION 'invalid_ref';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('event-points:' || p_user_id::text || ':' || p_event_id::text));

  IF EXISTS (SELECT 1 FROM public.point_transactions WHERE user_id = p_user_id AND reference_id = v_ref) THEN
    RETURN public.event_points_balance(p_user_id, p_event_id);
  END IF;

  v_balance := public.event_points_balance(p_user_id, p_event_id);
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  INSERT INTO public.point_transactions (user_id, amount, type, reference_id)
  VALUES (p_user_id, -p_amount, 'spend', v_ref);

  -- 全体の合計（記録用）も合わせて減らす
  UPDATE public.user_points
    SET balance = GREATEST(balance - p_amount, 0), updated_at = NOW()
    WHERE user_id = p_user_id;

  RETURN v_balance - p_amount;
END;
$$;

-- 6) 会計を取り消したときに、使ったポイントを戻す（同じ p_ref で使った分だけ。二重には戻さない）
CREATE OR REPLACE FUNCTION public.restore_event_points(
  p_user_id UUID,
  p_event_id UUID,
  p_ref TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT := 'event:' || p_event_id::text || ':' || p_ref;
  v_used INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('event-points:' || p_user_id::text || ':' || p_event_id::text));

  SELECT -amount INTO v_used
    FROM public.point_transactions
    WHERE user_id = p_user_id AND reference_id = v_ref AND type = 'spend';
  IF v_used IS NULL OR v_used <= 0 THEN
    RETURN public.event_points_balance(p_user_id, p_event_id);
  END IF;
  IF EXISTS (SELECT 1 FROM public.point_transactions WHERE user_id = p_user_id AND reference_id = v_ref || ':restore') THEN
    RETURN public.event_points_balance(p_user_id, p_event_id);
  END IF;

  INSERT INTO public.point_transactions (user_id, amount, type, reference_id)
  VALUES (p_user_id, v_used, 'earn', v_ref || ':restore');
  UPDATE public.user_points
    SET balance = balance + v_used, updated_at = NOW()
    WHERE user_id = p_user_id;

  RETURN public.event_points_balance(p_user_id, p_event_id);
END;
$$;

REVOKE ALL ON FUNCTION public.event_points_balance(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_event_points(UUID, UUID, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_event_points(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_points_balance(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_event_points(UUID, UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_event_points(UUID, UUID, TEXT) TO service_role;
