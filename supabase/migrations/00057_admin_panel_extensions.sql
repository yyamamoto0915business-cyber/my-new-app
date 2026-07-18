-- MachiGlyph Admin Panel: admin_logs 拡張 + 将来ドメイン用テーブル
-- 既存 admin_logs / contact_inquiries / organizer_notes を壊さない

-- =============================================================================
-- A. admin_logs 拡張（ポリモーフィック対象・監査メタ）
-- =============================================================================
ALTER TABLE public.admin_logs
  ALTER COLUMN target_organizer_id DROP NOT NULL;

ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS target_type TEXT;

ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS target_id UUID;

ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS ip_address TEXT;

ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS result TEXT NOT NULL DEFAULT 'success';

CREATE INDEX IF NOT EXISTS idx_admin_logs_target_type_id
  ON public.admin_logs (target_type, target_id);

-- =============================================================================
-- B. 将来ドメイン用テーブル（空でも作成・RLS: developer_admin）
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizer_id UUID REFERENCES public.organizers(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (entity_type IN ('individual', 'corporate')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resubmit', 'approved', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  document_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  bank_name TEXT,
  bank_branch TEXT,
  bank_account_type TEXT,
  bank_account_number_masked TEXT,
  bank_account_holder TEXT,
  admin_note TEXT,
  assigned_admin_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_moderation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'revision_requested', 'rejected')),
  admin_note TEXT,
  assigned_admin_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  admin_note TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'lifted')),
  admin_note TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  lifted_by UUID REFERENCES public.profiles(id),
  lifted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  evidence_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_note TEXT,
  assigned_admin_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.event_orders(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES public.event_participants(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_note TEXT,
  assigned_admin_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'identity_verifications',
    'event_moderation_reviews',
    'user_warnings',
    'user_suspensions',
    'content_reports',
    'refund_requests',
    'admin_notes'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      t || '_admin_all',
      t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_developer_admin(auth.uid())) WITH CHECK (public.is_developer_admin(auth.uid()))',
      t || '_admin_all',
      t
    );
  END LOOP;
END $$;
