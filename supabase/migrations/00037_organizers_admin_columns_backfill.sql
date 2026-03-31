-- MachiGlyph: organizers テーブルに管理画面用カラムを追加（未適用環境向けの後追い修正）
-- 既に追加済みの環境でも安全に実行できるよう IF NOT EXISTS を使う。

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

