-- MachiGlyph: 開発者管理画面・主催者プラン管理の DB 基盤
-- 既存 profiles / organizers / admin_logs を壊さず拡張

-- =============================================================================
-- A. profiles テーブルの拡張
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'organizer', 'developer_admin'));

-- =============================================================================
-- B. organizer_plan_state テーブル（主催者プラン状態の中心テーブル）
-- ※ 既存 organizer_subscriptions は Stripe 専用のため、別テーブルで管理
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.organizer_plan_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL UNIQUE REFERENCES public.organizers(id) ON DELETE CASCADE,

  current_plan TEXT NOT NULL DEFAULT 'free',
  billing_source TEXT NOT NULL DEFAULT 'free',

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_status TEXT,

  manual_grant_active BOOLEAN NOT NULL DEFAULT false,
  manual_grant_plan TEXT,
  manual_grant_expires_at TIMESTAMPTZ,
  grant_reason TEXT,

  feature_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by_admin UUID REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT organizer_plan_state_current_plan_check
    CHECK (current_plan IN ('free', 'organizer')),
  CONSTRAINT organizer_plan_state_billing_source_check
    CHECK (billing_source IN ('free', 'stripe', 'manual', 'campaign')),
  CONSTRAINT organizer_plan_state_manual_grant_plan_check
    CHECK (manual_grant_plan IS NULL OR manual_grant_plan IN ('organizer'))
);

-- =============================================================================
-- C. admin_logs テーブル拡張（既存 00031 に追加）
-- =============================================================================
ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS admin_email TEXT;

ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- target_organizer_id を organizers 参照に統一（既存が organizers なら維持）
-- 00031 で既に organizers(id) 参照なのでそのまま

-- =============================================================================
-- D. organizer_notes テーブル
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.organizer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- インデックス
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizer_plan_state_organizer_id
  ON public.organizer_plan_state(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_plan_state_current_plan
  ON public.organizer_plan_state(current_plan);
CREATE INDEX IF NOT EXISTS idx_organizer_plan_state_billing_source
  ON public.organizer_plan_state(billing_source);
CREATE INDEX IF NOT EXISTS idx_organizer_plan_state_manual_grant_active
  ON public.organizer_plan_state(manual_grant_active);
CREATE INDEX IF NOT EXISTS idx_organizer_plan_state_manual_grant_expires_at
  ON public.organizer_plan_state(manual_grant_expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON public.admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_organizer_id ON public.admin_logs(target_organizer_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON public.admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_organizer_notes_organizer_id ON public.organizer_notes(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_notes_created_at ON public.organizer_notes(created_at DESC);

-- =============================================================================
-- updated_at 自動更新トリガー
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_organizer_plan_state_updated_at ON public.organizer_plan_state;
CREATE TRIGGER set_organizer_plan_state_updated_at
  BEFORE UPDATE ON public.organizer_plan_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_organizer_notes_updated_at ON public.organizer_notes;
CREATE TRIGGER set_organizer_notes_updated_at
  BEFORE UPDATE ON public.organizer_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 既存 organizers から organizer_plan_state へデータ移行
-- =============================================================================
INSERT INTO public.organizer_plan_state (
  organizer_id,
  current_plan,
  billing_source,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_status,
  manual_grant_active,
  manual_grant_plan,
  manual_grant_expires_at,
  grant_reason,
  updated_by_admin
)
SELECT
  o.id,
  CASE
    WHEN COALESCE(o.manual_grant_active, false)
      AND (o.manual_grant_expires_at IS NULL OR o.manual_grant_expires_at > NOW())
    THEN COALESCE(o.manual_grant_plan, 'organizer')
    WHEN o.subscription_status IN ('active', 'trialing', 'past_due')
      AND (o.current_period_end IS NULL OR o.current_period_end > NOW())
    THEN COALESCE(o.plan, 'organizer')
    ELSE 'free'
  END,
  CASE
    WHEN COALESCE(o.manual_grant_active, false)
      AND (o.manual_grant_expires_at IS NULL OR o.manual_grant_expires_at > NOW())
    THEN 'manual'
    WHEN o.subscription_status IN ('active', 'trialing', 'past_due') THEN 'stripe'
    ELSE COALESCE(o.billing_source, 'free')
  END,
  o.stripe_customer_id,
  o.stripe_subscription_id,
  o.subscription_status,
  COALESCE(o.manual_grant_active, false),
  CASE WHEN COALESCE(o.manual_grant_active, false) THEN 'organizer' ELSE NULL END,
  o.manual_grant_expires_at,
  o.manual_grant_reason,
  o.updated_by_admin
FROM public.organizers o
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizer_plan_state ops WHERE ops.organizer_id = o.id
);

-- =============================================================================
-- RLS 有効化
-- =============================================================================
ALTER TABLE public.organizer_plan_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_notes ENABLE ROW LEVEL SECURITY;

-- profiles: developer_admin は全件参照可（一覧表示用）
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'developer_admin')
  );

-- organizers: developer_admin は全件参照可（一覧表示用）
CREATE POLICY "organizers_select_admin" ON public.organizers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

-- organizer_plan_state: organizer 本人は参照可、developer_admin は全件可
CREATE POLICY "organizer_plan_state_select_own" ON public.organizer_plan_state
  FOR SELECT USING (
    organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
  );

CREATE POLICY "organizer_plan_state_select_admin" ON public.organizer_plan_state
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

CREATE POLICY "organizer_plan_state_insert_admin" ON public.organizer_plan_state
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

CREATE POLICY "organizer_plan_state_update_admin" ON public.organizer_plan_state
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

-- admin_logs: developer_admin のみ
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_logs_select_admin" ON public.admin_logs;
CREATE POLICY "admin_logs_select_admin" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

DROP POLICY IF EXISTS "admin_logs_insert_admin" ON public.admin_logs;
CREATE POLICY "admin_logs_insert_admin" ON public.admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

-- organizer_notes: developer_admin のみ
CREATE POLICY "organizer_notes_select_admin" ON public.organizer_notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

CREATE POLICY "organizer_notes_insert_admin" ON public.organizer_notes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

CREATE POLICY "organizer_notes_update_admin" ON public.organizer_notes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

CREATE POLICY "organizer_notes_delete_admin" ON public.organizer_notes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'developer_admin')
  );

-- =============================================================================
-- 関数: is_developer_admin
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_developer_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'developer_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- トリガー: organizer_plan_state → organizers 同期（既存 UI 互換）
-- =============================================================================
CREATE OR REPLACE FUNCTION public.sync_organizer_plan_to_organizers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.organizers
  SET
    manual_grant_active = NEW.manual_grant_active,
    manual_grant_plan = NEW.manual_grant_plan,
    manual_grant_expires_at = NEW.manual_grant_expires_at,
    manual_grant_reason = NEW.grant_reason,
    billing_source = NEW.billing_source,
    updated_by_admin = NEW.updated_by_admin,
    updated_at = NOW()
  WHERE id = NEW.organizer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_organizer_plan_after_change ON public.organizer_plan_state;
CREATE TRIGGER sync_organizer_plan_after_change
  AFTER INSERT OR UPDATE ON public.organizer_plan_state
  FOR EACH ROW EXECUTE FUNCTION public.sync_organizer_plan_to_organizers();

-- =============================================================================
-- 関数: grant_organizer_plan (30日/90日付与)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.grant_organizer_plan(
  p_target_organizer_id UUID,
  p_grant_days INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
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
    'organizer',
    'manual',
    true,
    'organizer',
    NOW() + (p_grant_days || ' days')::INTERVAL,
    p_reason,
    v_admin_id
  )
  ON CONFLICT (organizer_id) DO UPDATE SET
    current_plan = 'organizer',
    billing_source = 'manual',
    manual_grant_active = true,
    manual_grant_plan = 'organizer',
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
    jsonb_build_object('grant_days', p_grant_days)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 関数: grant_organizer_plan_unlimited (無期限付与)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.grant_organizer_plan_unlimited(
  p_target_organizer_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
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
    'organizer',
    'manual',
    true,
    'organizer',
    NULL,
    p_reason,
    v_admin_id
  )
  ON CONFLICT (organizer_id) DO UPDATE SET
    current_plan = 'organizer',
    billing_source = 'manual',
    manual_grant_active = true,
    manual_grant_plan = 'organizer',
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
    after_value
  )
  VALUES (
    v_admin_id,
    p_target_organizer_id,
    'grant_unlimited',
    p_reason,
    v_before,
    v_after
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 関数: revoke_manual_grant
-- =============================================================================
CREATE OR REPLACE FUNCTION public.revoke_manual_grant(
  p_target_organizer_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_before JSONB;
  v_after JSONB;
  v_admin_id UUID;
  v_stripe_status TEXT;
  v_current_plan TEXT;
BEGIN
  v_admin_id := COALESCE(p_admin_user_id, auth.uid());
  IF NOT public.is_developer_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Permission denied: developer_admin required';
  END IF;

  SELECT to_jsonb(ops.*) INTO v_before
  FROM public.organizer_plan_state ops
  WHERE organizer_id = p_target_organizer_id;

  SELECT stripe_status INTO v_stripe_status
  FROM public.organizer_plan_state
  WHERE organizer_id = p_target_organizer_id;

  v_current_plan := CASE
    WHEN v_stripe_status IN ('active', 'trialing', 'past_due') THEN 'organizer'
    ELSE 'free'
  END;

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
    v_current_plan,
    CASE WHEN v_current_plan = 'organizer' THEN 'stripe' ELSE 'free' END,
    false,
    NULL,
    NULL,
    p_reason,
    v_admin_id
  )
  ON CONFLICT (organizer_id) DO UPDATE SET
    manual_grant_active = false,
    manual_grant_plan = NULL,
    manual_grant_expires_at = NULL,
    grant_reason = p_reason,
    current_plan = v_current_plan,
    billing_source = CASE WHEN v_current_plan = 'organizer' THEN 'stripe' ELSE 'free' END,
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
    after_value
  )
  VALUES (
    v_admin_id,
    p_target_organizer_id,
    'revoke_manual_grant',
    p_reason,
    v_before,
    v_after
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 関数: refresh_organizer_plan (Stripe / 手動状態から current_plan 再計算)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.refresh_organizer_plan(p_target_organizer_id UUID)
RETURNS VOID AS $$
DECLARE
  v_rec RECORD;
  v_new_plan TEXT;
  v_new_billing TEXT;
  v_manual_active BOOLEAN;
  v_manual_expires TIMESTAMPTZ;
  v_stripe_status TEXT;
BEGIN
  SELECT
    manual_grant_active,
    manual_grant_expires_at,
    stripe_status
  INTO v_rec
  FROM public.organizer_plan_state
  WHERE organizer_id = p_target_organizer_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_manual_active := v_rec.manual_grant_active
    AND (v_rec.manual_grant_expires_at IS NULL OR v_rec.manual_grant_expires_at > NOW());
  v_manual_expires := v_rec.manual_grant_expires_at;
  v_stripe_status := v_rec.stripe_status;

  IF v_manual_active THEN
    v_new_plan := 'organizer';
    v_new_billing := 'manual';
  ELSIF v_stripe_status IN ('active', 'trialing', 'past_due') THEN
    v_new_plan := 'organizer';
    v_new_billing := 'stripe';
  ELSE
    v_new_plan := 'free';
    v_new_billing := 'free';
  END IF;

  UPDATE public.organizer_plan_state
  SET current_plan = v_new_plan, billing_source = v_new_billing, updated_at = NOW()
  WHERE organizer_id = p_target_organizer_id
    AND (current_plan IS DISTINCT FROM v_new_plan OR billing_source IS DISTINCT FROM v_new_billing);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VIEW: admin_organizer_overview (一覧用)
-- =============================================================================
CREATE OR REPLACE VIEW public.admin_organizer_overview AS
SELECT
  o.id AS organizer_id,
  p.display_name,
  p.email,
  p.role,
  COALESCE(ops.current_plan, o.plan, 'free') AS current_plan,
  COALESCE(ops.billing_source, o.billing_source, 'free') AS billing_source,
  COALESCE(ops.manual_grant_active, o.manual_grant_active, false) AS manual_grant_active,
  COALESCE(ops.manual_grant_expires_at, o.manual_grant_expires_at) AS manual_grant_expires_at,
  COALESCE(ops.grant_reason, o.manual_grant_reason) AS grant_reason,
  o.created_at,
  o.updated_at,
  (SELECT COUNT(*)::INT FROM public.events e WHERE e.organizer_id = o.id) AS event_count,
  (SELECT COUNT(*)::INT FROM public.events e WHERE e.organizer_id = o.id AND e.status = 'published') AS published_event_count
FROM public.organizers o
LEFT JOIN public.profiles p ON p.id = o.profile_id
LEFT JOIN public.organizer_plan_state ops ON ops.organizer_id = o.id;

-- =============================================================================
-- 関数: set_developer_admin_by_email (seed / 手動設定用)
-- Supabase ダッシュボードの SQL Editor から実行: SELECT set_developer_admin_by_email('admin@example.com');
-- 本番では慎重に実行すること
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_developer_admin_by_email(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_affected INT;
BEGIN
  UPDATE public.profiles
  SET role = 'developer_admin', updated_at = NOW()
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
