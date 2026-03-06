-- MachiGlyph: 月980円サブスク + 無料特典 + スポンサー協賛（Stripe Connect）
-- Organizers: 課金・特典・Connect状態
ALTER TABLE public.organizers
  DROP CONSTRAINT IF EXISTS organizers_plan_check;
ALTER TABLE public.organizers
  ADD CONSTRAINT organizers_plan_check CHECK (plan IN ('free', 'light', 'standard', 'trial', 'starter'));

ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS earlybird_eligible BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS full_feature_trial_end_at TIMESTAMPTZ;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS founder30_granted_at TIMESTAMPTZ;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS founder30_end_at TIMESTAMPTZ;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS stripe_account_charges_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS stripe_account_details_submitted BOOLEAN NOT NULL DEFAULT false;

-- Events: status, published_at, sponsor_enabled
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsor_enabled BOOLEAN NOT NULL DEFAULT true;

-- 既存イベントは公開扱い（後方互換）
UPDATE public.events SET status = 'published', published_at = created_at WHERE status = 'draft' AND published_at IS NULL;

-- Sponsorships: 協賛購入（10k/30k/50k、Stripe Connect分配）
CREATE TABLE IF NOT EXISTS public.sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,

  amount_jpy INTEGER NOT NULL,
  platform_fee_jpy INTEGER NOT NULL,
  organizer_net_jpy INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'jpy',

  sponsor_name TEXT,
  sponsor_company TEXT,
  sponsor_email TEXT,

  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  receipt_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_sponsorships_event ON public.sponsorships(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_organizer ON public.sponsorships(organizer_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON public.sponsorships(status);

ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sponsorships_select_organizer" ON public.sponsorships FOR SELECT USING (
  organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
);

-- Founder30: 先着30団体に月3本公開枠（1年間）を付与。競合対策で advisory lock 使用
CREATE OR REPLACE FUNCTION public.maybe_grant_founder30(p_organizer_id UUID)
RETURNS VOID AS $$
DECLARE
  cnt INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('machiglyph_founder30')::bigint);
  SELECT COUNT(*)::INTEGER INTO cnt FROM public.organizers WHERE founder30_granted_at IS NOT NULL;
  IF cnt < 30 THEN
    UPDATE public.organizers
    SET founder30_granted_at = NOW(), founder30_end_at = NOW() + INTERVAL '1 year'
    WHERE id = p_organizer_id AND founder30_granted_at IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
