-- MachiGlyph: 物理店舗（stores）
-- 主催者が飲食店・カフェ等を掲載・管理する

CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  category TEXT,
  tagline TEXT,
  description TEXT,

  cover_image_url TEXT,
  gallery_images TEXT[] NOT NULL DEFAULT '{}',
  -- wifi / terrace / child / takeout / power / parking 等
  features TEXT[] NOT NULL DEFAULT '{}',

  hours_label TEXT,

  -- draft: 下書き / public: 公開中 / private: 非公開
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'public', 'private')),
  published_at TIMESTAMPTZ,

  -- アクセス・基本情報（後続タブでも利用）
  address TEXT,
  phone TEXT,
  seats_info TEXT,
  payment_methods TEXT,
  access_note TEXT,
  website_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_organizer_id ON public.stores (organizer_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores (status);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 公開中のみ誰でも参照可
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stores'
      AND policyname = 'stores_select_public'
  ) THEN
    CREATE POLICY "stores_select_public"
      ON public.stores FOR SELECT
      USING (
        status = 'public'
        OR organizer_id IN (
          SELECT id FROM public.organizers WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stores'
      AND policyname = 'stores_insert_own'
  ) THEN
    CREATE POLICY "stores_insert_own"
      ON public.stores FOR INSERT
      TO authenticated
      WITH CHECK (
        organizer_id IN (
          SELECT id FROM public.organizers WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stores'
      AND policyname = 'stores_update_own'
  ) THEN
    CREATE POLICY "stores_update_own"
      ON public.stores FOR UPDATE
      TO authenticated
      USING (
        organizer_id IN (
          SELECT id FROM public.organizers WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stores'
      AND policyname = 'stores_delete_own'
  ) THEN
    CREATE POLICY "stores_delete_own"
      ON public.stores FOR DELETE
      TO authenticated
      USING (
        organizer_id IN (
          SELECT id FROM public.organizers WHERE profile_id = auth.uid()
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
    DROP TRIGGER IF EXISTS set_stores_updated_at ON public.stores;
    CREATE TRIGGER set_stores_updated_at
      BEFORE UPDATE ON public.stores
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
