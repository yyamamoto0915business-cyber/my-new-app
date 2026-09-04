-- MachiGlyph: レジ・当日販売（POS）

CREATE TABLE IF NOT EXISTS public.pos_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  price_yen INTEGER NOT NULL DEFAULT 0 CHECK (price_yen >= 0),
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('food', 'drink', 'ticket', 'goods', 'other')),
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_products_organizer_id
  ON public.pos_products (organizer_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_event_id
  ON public.pos_products (event_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_active
  ON public.pos_products (organizer_id, is_active);

CREATE TABLE IF NOT EXISTS public.pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,

  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('cash', 'online')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),

  total_yen INTEGER NOT NULL CHECK (total_yen >= 0),
  cash_received_yen INTEGER,
  cash_change_yen INTEGER,
  platform_fee_yen INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_yen >= 0),
  organizer_net_yen INTEGER NOT NULL DEFAULT 0 CHECK (organizer_net_yen >= 0),

  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,

  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_sales_organizer_id
  ON public.pos_sales (organizer_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_event_id
  ON public.pos_sales (event_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_status_paid_at
  ON public.pos_sales (organizer_id, status, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sales_created_at
  ON public.pos_sales (organizer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.pos_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.pos_products(id) ON DELETE SET NULL,

  product_name TEXT NOT NULL,
  unit_price_yen INTEGER NOT NULL CHECK (unit_price_yen >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_yen INTEGER NOT NULL CHECK (line_total_yen >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_sale_items_sale_id
  ON public.pos_sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_pos_sale_items_product_id
  ON public.pos_sale_items (product_id);

ALTER TABLE public.pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pos_products'
      AND policyname = 'pos_products_select_own'
  ) THEN
    CREATE POLICY "pos_products_select_own"
      ON public.pos_products FOR SELECT TO authenticated
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
    WHERE schemaname = 'public' AND tablename = 'pos_products'
      AND policyname = 'pos_products_insert_own'
  ) THEN
    CREATE POLICY "pos_products_insert_own"
      ON public.pos_products FOR INSERT TO authenticated
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
    WHERE schemaname = 'public' AND tablename = 'pos_products'
      AND policyname = 'pos_products_update_own'
  ) THEN
    CREATE POLICY "pos_products_update_own"
      ON public.pos_products FOR UPDATE TO authenticated
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
    WHERE schemaname = 'public' AND tablename = 'pos_products'
      AND policyname = 'pos_products_delete_own'
  ) THEN
    CREATE POLICY "pos_products_delete_own"
      ON public.pos_products FOR DELETE TO authenticated
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
    WHERE schemaname = 'public' AND tablename = 'pos_sales'
      AND policyname = 'pos_sales_select_own'
  ) THEN
    CREATE POLICY "pos_sales_select_own"
      ON public.pos_sales FOR SELECT TO authenticated
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
    WHERE schemaname = 'public' AND tablename = 'pos_sales'
      AND policyname = 'pos_sales_insert_own'
  ) THEN
    CREATE POLICY "pos_sales_insert_own"
      ON public.pos_sales FOR INSERT TO authenticated
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
    WHERE schemaname = 'public' AND tablename = 'pos_sales'
      AND policyname = 'pos_sales_update_own'
  ) THEN
    CREATE POLICY "pos_sales_update_own"
      ON public.pos_sales FOR UPDATE TO authenticated
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
    WHERE schemaname = 'public' AND tablename = 'pos_sale_items'
      AND policyname = 'pos_sale_items_select_own'
  ) THEN
    CREATE POLICY "pos_sale_items_select_own"
      ON public.pos_sale_items FOR SELECT TO authenticated
      USING (
        sale_id IN (
          SELECT s.id FROM public.pos_sales s
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
    WHERE schemaname = 'public' AND tablename = 'pos_sale_items'
      AND policyname = 'pos_sale_items_insert_own'
  ) THEN
    CREATE POLICY "pos_sale_items_insert_own"
      ON public.pos_sale_items FOR INSERT TO authenticated
      WITH CHECK (
        sale_id IN (
          SELECT s.id FROM public.pos_sales s
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
    DROP TRIGGER IF EXISTS trg_pos_products_updated_at ON public.pos_products;
    CREATE TRIGGER trg_pos_products_updated_at
      BEFORE UPDATE ON public.pos_products
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    DROP TRIGGER IF EXISTS trg_pos_sales_updated_at ON public.pos_sales;
    CREATE TRIGGER trg_pos_sales_updated_at
      BEFORE UPDATE ON public.pos_sales
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
