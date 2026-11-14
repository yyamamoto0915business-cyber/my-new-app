-- TEAM プラン（月額5,980円）を、プランの名前として使えるようにする。
-- - organizers.plan / organizer_plan_state の current_plan・manual_grant_plan に 'team' を足す
-- - 開発者の手動付与（grant_organizer_plan / grant_organizer_plan_unlimited）で 'team' を選べるようにする
--   （Stripe・App Store の商品ができる前に、TEAM の動きを確かめられるように）
-- TEAM は GAME の機能をすべて含む（アプリ側：lib/billing.ts）。関数の中身は 00111 と同じで、受け付けるプランに 'team' を足しただけ。

ALTER TABLE public.organizers
  DROP CONSTRAINT IF EXISTS organizers_plan_check;
ALTER TABLE public.organizers
  ADD CONSTRAINT organizers_plan_check
  CHECK (plan IN ('free', 'light', 'standard', 'trial', 'starter', 'game', 'team'));

ALTER TABLE public.organizer_plan_state
  DROP CONSTRAINT IF EXISTS organizer_plan_state_current_plan_check;
ALTER TABLE public.organizer_plan_state
  ADD CONSTRAINT organizer_plan_state_current_plan_check
  CHECK (current_plan IN ('free', 'organizer', 'game', 'team'));

ALTER TABLE public.organizer_plan_state
  DROP CONSTRAINT IF EXISTS organizer_plan_state_manual_grant_plan_check;
ALTER TABLE public.organizer_plan_state
  ADD CONSTRAINT organizer_plan_state_manual_grant_plan_check
  CHECK (manual_grant_plan IS NULL OR manual_grant_plan IN ('organizer', 'game', 'team'));

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
  IF p_plan NOT IN ('organizer', 'game', 'team') THEN
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
  IF p_plan NOT IN ('organizer', 'game', 'team') THEN
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

