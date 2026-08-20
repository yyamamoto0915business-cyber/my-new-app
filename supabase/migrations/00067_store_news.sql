-- MachiGlyph: 店舗ニュース（store_news）

CREATE TABLE IF NOT EXISTS public.store_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  thumbnail_url TEXT,

  category TEXT NOT NULL DEFAULT 'business'
    CHECK (category IN ('sale', 'new_item', 'coupon', 'business')),

  period_start DATE,
  period_end DATE,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'public', 'ended')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_news_store_id ON public.store_news (store_id);
CREATE INDEX IF NOT EXISTS idx_store_news_status ON public.store_news (status);

ALTER TABLE public.store_news ENABLE ROW LEVEL SECURITY;

-- 公開中ニュースは誰でも参照可。それ以外は店舗オーナーのみ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_news'
      AND policyname = 'store_news_select'
  ) THEN
    CREATE POLICY "store_news_select"
      ON public.store_news FOR SELECT
      USING (
        status = 'public'
        OR store_id IN (
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
      AND tablename = 'store_news'
      AND policyname = 'store_news_insert_own'
  ) THEN
    CREATE POLICY "store_news_insert_own"
      ON public.store_news FOR INSERT
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
      AND tablename = 'store_news'
      AND policyname = 'store_news_update_own'
  ) THEN
    CREATE POLICY "store_news_update_own"
      ON public.store_news FOR UPDATE
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_news'
      AND policyname = 'store_news_delete_own'
  ) THEN
    CREATE POLICY "store_news_delete_own"
      ON public.store_news FOR DELETE
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'set_updated_at' AND pronamespace = 'public'::regnamespace
  ) THEN
    DROP TRIGGER IF EXISTS set_store_news_updated_at ON public.store_news;
    CREATE TRIGGER set_store_news_updated_at
      BEFORE UPDATE ON public.store_news
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
