-- 掲載（イベント・お店・キッチンカー・募集）の詳細ページが開かれた回数を、日ごとに数える（主催者のダッシュボードの「閲覧数」）。
-- 1回ずつの行は残さず、日ごとの合計だけを持つ（だれが見たかは残さない）。
-- 数え始めはこのマイグレーションを入れた日から。

CREATE TABLE IF NOT EXISTS public.listing_view_daily (
  kind TEXT NOT NULL CHECK (kind IN ('event', 'store', 'recruitment')),
  target_id UUID NOT NULL,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  -- 日本時間の日付
  day DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  PRIMARY KEY (kind, target_id, day)
);

CREATE INDEX IF NOT EXISTS idx_listing_view_daily_org_day ON public.listing_view_daily (organizer_id, day);

ALTER TABLE public.listing_view_daily ENABLE ROW LEVEL SECURITY;

-- 主催者は自分の掲載の数だけ読める（書くのは下の関数だけ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'listing_view_daily' AND policyname = 'listing_view_daily_select_own'
  ) THEN
    CREATE POLICY "listing_view_daily_select_own"
      ON public.listing_view_daily FOR SELECT TO authenticated
      USING (organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid()));
  END IF;
END $$;

-- 詳細ページを開いたときに1つ足す。アプリのサーバー（/api/views、service_role）だけが呼ぶ。
-- 掲載が見つからないときは何もしない。
CREATE OR REPLACE FUNCTION public.record_listing_view(p_kind TEXT, p_target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org UUID;
  v_day DATE := (NOW() AT TIME ZONE 'Asia/Tokyo')::date;
BEGIN
  IF p_kind = 'event' THEN
    SELECT organizer_id INTO v_org FROM public.events WHERE id = p_target_id;
  ELSIF p_kind = 'store' THEN
    SELECT organizer_id INTO v_org FROM public.stores WHERE id = p_target_id;
  ELSIF p_kind = 'recruitment' THEN
    SELECT organizer_id INTO v_org FROM public.recruitments WHERE id = p_target_id;
  ELSE
    RETURN;
  END IF;
  IF v_org IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.listing_view_daily (kind, target_id, organizer_id, day, views)
  VALUES (p_kind, p_target_id, v_org, v_day, 1)
  ON CONFLICT (kind, target_id, day) DO UPDATE SET views = public.listing_view_daily.views + 1;
END;
$$;

-- Supabase は public の関数を anon・authenticated にも渡すので、両方から外す（00128 と同じ）
REVOKE ALL ON FUNCTION public.record_listing_view(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_listing_view(TEXT, UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_listing_view(TEXT, UUID) TO service_role;
