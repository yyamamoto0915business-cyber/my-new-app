-- MachiGlyph: 店舗メニュー・商品（store_menu_items）

CREATE TABLE IF NOT EXISTS public.store_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  price_yen INTEGER NOT NULL DEFAULT 0 CHECK (price_yen >= 0),
  image_url TEXT,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'public')),
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_menu_items_store_id
  ON public.store_menu_items (store_id);
CREATE INDEX IF NOT EXISTS idx_store_menu_items_status
  ON public.store_menu_items (status);

ALTER TABLE public.store_menu_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_menu_items'
      AND policyname = 'store_menu_items_select'
  ) THEN
    CREATE POLICY "store_menu_items_select"
      ON public.store_menu_items FOR SELECT
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
      AND tablename = 'store_menu_items'
      AND policyname = 'store_menu_items_insert_own'
  ) THEN
    CREATE POLICY "store_menu_items_insert_own"
      ON public.store_menu_items FOR INSERT
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
      AND tablename = 'store_menu_items'
      AND policyname = 'store_menu_items_update_own'
  ) THEN
    CREATE POLICY "store_menu_items_update_own"
      ON public.store_menu_items FOR UPDATE
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
      AND tablename = 'store_menu_items'
      AND policyname = 'store_menu_items_delete_own'
  ) THEN
    CREATE POLICY "store_menu_items_delete_own"
      ON public.store_menu_items FOR DELETE
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
    DROP TRIGGER IF EXISTS set_store_menu_items_updated_at ON public.store_menu_items;
    CREATE TRIGGER set_store_menu_items_updated_at
      BEFORE UPDATE ON public.store_menu_items
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
