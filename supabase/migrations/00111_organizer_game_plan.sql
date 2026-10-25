-- MachiGlyph: GAME プラン（月額2,980円）を追加
-- organizers.plan / organizer_plan_state の 'game' を GAME、従来の 'starter' / 'organizer' を STANDARD として扱う

-- =============================================================================
-- A. 制約に 'game' を追加
-- =============================================================================
ALTER TABLE public.organizers
  DROP CONSTRAINT IF EXISTS organizers_plan_check;
ALTER TABLE public.organizers
  ADD CONSTRAINT organizers_plan_check
  CHECK (plan IN ('free', 'light', 'standard', 'trial', 'starter', 'game'));

ALTER TABLE public.organizer_plan_state
  DROP CONSTRAINT IF EXISTS organizer_plan_state_current_plan_check;
ALTER TABLE public.organizer_plan_state
  ADD CONSTRAINT organizer_plan_state_current_plan_check
  CHECK (current_plan IN ('free', 'organizer', 'game'));

ALTER TABLE public.organizer_plan_state
  DROP CONSTRAINT IF EXISTS organizer_plan_state_manual_grant_plan_check;
ALTER TABLE public.organizer_plan_state
  ADD CONSTRAINT organizer_plan_state_manual_grant_plan_check
  CHECK (manual_grant_plan IS NULL OR manual_grant_plan IN ('organizer', 'game'));

-- =============================================================================
-- B. 手動付与関数に付与プラン（p_plan）を追加
-- 引数が増えるため旧シグネチャを削除してから作り直す
-- =============================================================================
DROP FUNCTION IF EXISTS public.grant_organizer_plan(UUID, INTEGER, TEXT, UUID);
DROP FUNCTION IF EXISTS public.grant_organizer_plan_unlimited(UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.grant_organizer_plan(
  p_target_organizer_id UUID,
  p_grant_days INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL,
  p_plan TEXT DEFAULT 'organizer'
)
RETURNS VOID AS $$
DECLARE
  v_before JSONB;
  v_after JSONB;
  v_admin_id UUID;
BEGIN
  v_admin_id := COALESCE(p_admin_user_id, auth.uid());
  IF NOT public.is_developer_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Permission denied: developer_admin required';
  END IF;
  IF p_plan NOT IN ('organizer', 'game') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan;
  END IF;

  SELECT to_jsonb(ops.*) INTO v_before
  FROM public.organizer_plan_state ops
  WHERE organizer_id = p_target_organizer_id;

  INSERT INTO public.organizer_plan_state (
    organizer_id,
    current_plan,
    billing_source,
    manual_grant_active,
    manual_grant_plan,
    manual_grant_expires_at,
    grant_reason,
    updated_by_admin
  )
  VALUES (
    p_target_organizer_id,
    p_plan,
    'manual',
    true,
    p_plan,
    NOW() + (p_grant_days || ' days')::INTERVAL,
    p_reason,
    v_admin_id
  )
  ON CONFLICT (organizer_id) DO UPDATE SET
    current_plan = p_plan,
    billing_source = 'manual',
    manual_grant_active = true,
    manual_grant_plan = p_plan,
    manual_grant_expires_at = NOW() + (p_grant_days || ' days')::INTERVAL,
    grant_reason = p_reason,
    updated_by_admin = v_admin_id,
    updated_at = NOW();

  SELECT to_jsonb(ops.*) INTO v_after
  FROM public.organizer_plan_state ops
  WHERE organizer_id = p_target_organizer_id;

  INSERT INTO public.admin_logs (
    admin_user_id,
    target_organizer_id,
    action_type,
    reason,
    before_value,
    after_value,
    metadata
  )
  VALUES (
    v_admin_id,
    p_target_organizer_id,
    'grant_' || p_grant_days || '_days',
    p_reason,
    v_before,
    v_after,
    jsonb_build_object('grant_days', p_grant_days, 'plan', p_plan)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.grant_organizer_plan_unlimited(
  p_target_organizer_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL,
  p_plan TEXT DEFAULT 'organizer'
)
RETURNS VOID AS $$
DECLARE
  v_before JSONB;
  v_after JSONB;
  v_admin_id UUID;
BEGIN
  v_admin_id := COALESCE(p_admin_user_id, auth.uid());
  IF NOT public.is_developer_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Permission denied: developer_admin required';
  END IF;
  IF p_plan NOT IN ('organizer', 'game') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan;
  END IF;

  SELECT to_jsonb(ops.*) INTO v_before
  FROM public.organizer_plan_state ops
  WHERE organizer_id = p_target_organizer_id;

  INSERT INTO public.organizer_plan_state (
    organizer_id,
    current_plan,
    billing_source,
    manual_grant_active,
    manual_grant_plan,
    manual_grant_expires_at,
    grant_reason,
    updated_by_admin
  )
  VALUES (
    p_target_organizer_id,
    p_plan,
    'manual',
    true,
    p_plan,
    NULL,
    p_reason,
    v_admin_id
  )
  ON CONFLICT (organizer_id) DO UPDATE SET
    current_plan = p_plan,
    billing_source = 'manual',
    manual_grant_active = true,
    manual_grant_plan = p_plan,
    manual_grant_expires_at = NULL,
    grant_reason = p_reason,
    updated_by_admin = v_admin_id,
    updated_at = NOW();

  SELECT to_jsonb(ops.*) INTO v_after
  FROM public.organizer_plan_state ops
  WHERE organizer_id = p_target_organizer_id;

  INSERT INTO public.admin_logs (
    admin_user_id,
    target_organizer_id,
    action_type,
    reason,
    before_value,
    after_value,
    metadata
  )
  VALUES (
    v_admin_id,
    p_target_organizer_id,
    'grant_unlimited',
    p_reason,
    v_before,
    v_after,
    jsonb_build_object('plan', p_plan)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- C. 課金関連の列を主催者本人が直接書き換えられないようにする
-- organizers_update_own（本人は全列 UPDATE 可）のままだと、クライアントから
-- subscription_status / plan / manual_grant_* を書き換えて有料機能を使えてしまう。
-- Webhook（service_role）と SECURITY DEFINER の管理関数からの更新は対象外。
-- =============================================================================
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
  THEN
    RAISE EXCEPTION 'organizers billing columns cannot be updated by the client';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_organizer_billing_columns ON public.organizers;
CREATE TRIGGER guard_organizer_billing_columns
  BEFORE INSERT OR UPDATE ON public.organizers
  FOR EACH ROW EXECUTE FUNCTION public.guard_organizer_billing_columns();

-- =============================================================================
-- D. profiles.role を本人が書き換えられないようにする
-- profiles_update_own（本人は全列 UPDATE 可）のままだと、クライアントから
-- role = 'developer_admin' に変えて管理者権限（プラン付与など）を得られてしまう。
-- set_developer_admin_by_email（SECURITY DEFINER）や service_role からの変更は対象外。
-- =============================================================================
CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'user' AND NEW.role IS DISTINCT FROM 'organizer' THEN
      RAISE EXCEPTION 'profiles.role cannot be set by the client';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
    AND NOT (OLD.role = 'user' AND NEW.role = 'organizer')
  THEN
    RAISE EXCEPTION 'profiles.role cannot be updated by the client';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_profile_role ON public.profiles;
CREATE TRIGGER guard_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();
