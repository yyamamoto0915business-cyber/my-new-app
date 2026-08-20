-- MachiGlyph: キッチンカー（stores.kind）＋出店スケジュール

-- 店舗 / キッチンカーの種別
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'store'
    CHECK (kind IN ('store', 'kitchen_car'));

CREATE INDEX IF NOT EXISTS idx_stores_kind ON public.stores (kind);
CREATE INDEX IF NOT EXISTS idx_stores_organizer_kind ON public.stores (organizer_id, kind);

-- ニュース分類に「出店情報」を追加
ALTER TABLE public.store_news
  DROP CONSTRAINT IF EXISTS store_news_category_check;

ALTER TABLE public.store_news
  ADD CONSTRAINT store_news_category_check
  CHECK (category IN ('sale', 'new_item', 'coupon', 'business', 'stall'));

-- 出店スケジュール
CREATE TABLE IF NOT EXISTS public.store_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  event_date DATE NOT NULL,
  event_name TEXT NOT NULL,
  location TEXT,
  start_time TEXT,
  end_time TEXT,
  stall_area TEXT,

  -- scheduled: 出店予定 / adjusting: 調整中 / cancelled: 中止
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'adjusting', 'cancelled')),

  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_schedules_store_id ON public.store_schedules (store_id);
CREATE INDEX IF NOT EXISTS idx_store_schedules_event_date ON public.store_schedules (event_date);

ALTER TABLE public.store_schedules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_schedules'
      AND policyname = 'store_schedules_select'
  ) THEN
    CREATE POLICY "store_schedules_select"
      ON public.store_schedules FOR SELECT
      USING (
        store_id IN (
          SELECT s.id FROM public.stores s
          WHERE s.status = 'public'
             OR s.organizer_id IN (
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
    WHERE schemaname = 'public'
      AND tablename = 'store_schedules'
      AND policyname = 'store_schedules_insert_own'
  ) THEN
    CREATE POLICY "store_schedules_insert_own"
      ON public.store_schedules FOR INSERT
      TO authenticated
      WITH CHECK (
        store_id IN (
          SELECT s.id FROM public.stores s
          WHERE s.organizer_id IN (
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
    WHERE schemaname = 'public'
      AND tablename = 'store_schedules'
      AND policyname = 'store_schedules_update_own'
  ) THEN
    CREATE POLICY "store_schedules_update_own"
      ON public.store_schedules FOR UPDATE
      TO authenticated
      USING (
        store_id IN (
          SELECT s.id FROM public.stores s
          WHERE s.organizer_id IN (
            SELECT id FROM public.organizers WHERE profile_id = auth.uid()
          )
        )
      )
      WITH CHECK (
        store_id IN (
          SELECT s.id FROM public.stores s
          WHERE s.organizer_id IN (
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
    WHERE schemaname = 'public'
      AND tablename = 'store_schedules'
      AND policyname = 'store_schedules_delete_own'
  ) THEN
    CREATE POLICY "store_schedules_delete_own"
      ON public.store_schedules FOR DELETE
      TO authenticated
      USING (
        store_id IN (
          SELECT s.id FROM public.stores s
          WHERE s.organizer_id IN (
            SELECT id FROM public.organizers WHERE profile_id = auth.uid()
          )
        )
      );
  END IF;
END $$;
