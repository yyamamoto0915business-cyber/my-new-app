-- events: スポンサーチケット・定員・優先枠・言語対応
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS sponsor_ticket_prices INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sponsor_perks JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS priority_slots INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS english_guide_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- sponsor_ticket_purchases: スポンサーチケット購入
CREATE TABLE IF NOT EXISTS public.sponsor_ticket_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  perk_type TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sponsor_ticket_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_ticket_purchases_select_all" ON public.sponsor_ticket_purchases FOR SELECT USING (true);
CREATE POLICY "sponsor_ticket_purchases_insert_own" ON public.sponsor_ticket_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
