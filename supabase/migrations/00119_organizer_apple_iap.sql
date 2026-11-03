-- MachiGlyph: 主催者プランを iOS アプリの App 内課金（Apple）でも申し込めるようにする
-- 有料かどうかは今までどおり organizers.plan / subscription_status で判定し、
-- どこで払っているかを subscription_provider で見分ける（NULL は Stripe 時代の行）。
-- 管理画面用の billing_source（free / stripe / manual / campaign）とは別の列。

ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS subscription_provider TEXT,
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_product_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_environment TEXT,
  ADD COLUMN IF NOT EXISTS apple_signed_at TIMESTAMPTZ;

ALTER TABLE public.organizers
  DROP CONSTRAINT IF EXISTS organizers_subscription_provider_check;
ALTER TABLE public.organizers
  ADD CONSTRAINT organizers_subscription_provider_check
  CHECK (subscription_provider IS NULL OR subscription_provider IN ('stripe', 'apple'));

CREATE UNIQUE INDEX IF NOT EXISTS organizers_apple_original_transaction_id_key
  ON public.organizers (apple_original_transaction_id)
  WHERE apple_original_transaction_id IS NOT NULL;

-- 00111 の guard_organizer_billing_columns に Apple の列を足す（本人が書き換えられないように）
CREATE OR REPLACE FUNCTION public.guard_organizer_billing_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.plan NOT IN ('free', 'trial')
      OR NEW.subscription_status IS NOT NULL
      OR NEW.stripe_subscription_id IS NOT NULL
      OR NEW.stripe_customer_id IS NOT NULL
      OR COALESCE(NEW.manual_grant_active, false)
      OR NEW.manual_grant_plan IS NOT NULL
      OR NEW.founder30_end_at IS NOT NULL
      OR NEW.subscription_provider IS NOT NULL
      OR NEW.apple_original_transaction_id IS NOT NULL
      OR NEW.apple_product_id IS NOT NULL
    THEN
      RAISE EXCEPTION 'organizers billing columns cannot be set by the client';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
    OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
    OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
    OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
    OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
    OR NEW.manual_grant_active IS DISTINCT FROM OLD.manual_grant_active
    OR NEW.manual_grant_plan IS DISTINCT FROM OLD.manual_grant_plan
    OR NEW.manual_grant_expires_at IS DISTINCT FROM OLD.manual_grant_expires_at
    OR NEW.billing_source IS DISTINCT FROM OLD.billing_source
    OR NEW.earlybird_eligible IS DISTINCT FROM OLD.earlybird_eligible
    OR NEW.full_feature_trial_end_at IS DISTINCT FROM OLD.full_feature_trial_end_at
    OR NEW.founder30_granted_at IS DISTINCT FROM OLD.founder30_granted_at
    OR NEW.founder30_end_at IS DISTINCT FROM OLD.founder30_end_at
    OR NEW.subscription_provider IS DISTINCT FROM OLD.subscription_provider
    OR NEW.apple_original_transaction_id IS DISTINCT FROM OLD.apple_original_transaction_id
    OR NEW.apple_product_id IS DISTINCT FROM OLD.apple_product_id
    OR NEW.apple_environment IS DISTINCT FROM OLD.apple_environment
    OR NEW.apple_signed_at IS DISTINCT FROM OLD.apple_signed_at
  THEN
    RAISE EXCEPTION 'organizers billing columns cannot be updated by the client';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
