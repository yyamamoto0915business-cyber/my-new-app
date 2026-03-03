-- sponsor_tiers: 応援プラン（個人/企業）
CREATE TABLE IF NOT EXISTS public.sponsor_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('individual', 'company')),
  price INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  benefits TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_tiers_event ON public.sponsor_tiers(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_tiers_type ON public.sponsor_tiers(event_id, type);

-- sponsor_purchases: 個人応援チケット購入
CREATE TABLE IF NOT EXISTS public.sponsor_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.sponsor_tiers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  display_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_purchases_event ON public.sponsor_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_purchases_status ON public.sponsor_purchases(status);

-- sponsor_applications: 企業スポンサー申込
CREATE TABLE IF NOT EXISTS public.sponsor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.sponsor_tiers(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  invoice_info TEXT,
  message TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_applications_event ON public.sponsor_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_applications_status ON public.sponsor_applications(status);

ALTER TABLE public.sponsor_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_tiers_select_all" ON public.sponsor_tiers FOR SELECT USING (true);
CREATE POLICY "sponsor_purchases_select_all" ON public.sponsor_purchases FOR SELECT USING (true);
CREATE POLICY "sponsor_applications_select_all" ON public.sponsor_applications FOR SELECT USING (true);
CREATE POLICY "sponsor_purchases_insert_all" ON public.sponsor_purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "sponsor_purchases_update_all" ON public.sponsor_purchases FOR UPDATE USING (true);
CREATE POLICY "sponsor_applications_insert_all" ON public.sponsor_applications FOR INSERT WITH CHECK (true);
