-- MachiGlyph: Stripe Checkout 用テーブル（応援・有料イベント・主催者サブスク）
-- 将来 Stripe Connect で主催者分配も可能な設計

-- support_payments: 応援決済（500/1000/3000円）
CREATE TABLE IF NOT EXISTS public.support_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_payments_event ON public.support_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_support_payments_user ON public.support_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_support_payments_status ON public.support_payments(status);

ALTER TABLE public.support_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_payments_select_own" ON public.support_payments FOR SELECT USING (user_id = auth.uid());

-- event_orders: 有料イベント参加費決済
CREATE TABLE IF NOT EXISTS public.event_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_orders_event ON public.event_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_orders_user ON public.event_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_event_orders_status ON public.event_orders(status);

ALTER TABLE public.event_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_orders_select_participant" ON public.event_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "event_orders_select_organizer" ON public.event_orders FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid()))
);

-- organizer_subscriptions: 主催者月額プラン
CREATE TABLE IF NOT EXISTS public.organizer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organizer_id)
);

CREATE INDEX IF NOT EXISTS idx_organizer_subscriptions_user ON public.organizer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_subscriptions_organizer ON public.organizer_subscriptions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_subscriptions_status ON public.organizer_subscriptions(status);

ALTER TABLE public.organizer_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer_subscriptions_select_own" ON public.organizer_subscriptions FOR SELECT USING (
  user_id = auth.uid() OR organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
);

-- events: 有料イベント用 stripe_price_id（オプション、設定時はこれを優先）
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
