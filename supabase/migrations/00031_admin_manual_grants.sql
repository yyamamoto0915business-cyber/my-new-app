-- MachiGlyph: 開発者専用 管理画面用の手動付与 & 監査ログ

-- organizers テーブル拡張（手動付与メタ・課金ソース）
ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS manual_grant_active BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS manual_grant_plan TEXT;

ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS manual_grant_expires_at TIMESTAMPTZ;

ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS manual_grant_reason TEXT;

ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS billing_source TEXT;

ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS updated_by_admin UUID REFERENCES public.profiles(id);

-- 管理者操作の監査ログ
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,

  action_type TEXT NOT NULL,
  before_value JSONB,
  after_value JSONB,
  reason TEXT
);

-- 将来的な RLS ポリシー追加を見越して、現時点では RLS 無効のままにしておく

