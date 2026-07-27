-- 応募: フォーム回答・提出完了時刻
ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS form_answers JSONB DEFAULT NULL;

ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS form_completed_at TIMESTAMPTZ DEFAULT NULL;

-- 既存応募は提出済み扱い（フォーム機能導入前）
UPDATE public.recruitment_applications
SET form_completed_at = COALESCE(created_at, NOW())
WHERE form_completed_at IS NULL;

CREATE INDEX IF NOT EXISTS recruitment_applications_form_pending_idx
  ON public.recruitment_applications (user_id)
  WHERE form_completed_at IS NULL;
