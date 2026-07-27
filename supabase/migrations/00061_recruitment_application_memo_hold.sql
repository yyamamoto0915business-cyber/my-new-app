-- 応募: 主催者メモ・保留ステータス
ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS organizer_memo TEXT;

ALTER TABLE public.recruitment_applications
  DROP CONSTRAINT IF EXISTS recruitment_applications_status_check;

ALTER TABLE public.recruitment_applications
  ADD CONSTRAINT recruitment_applications_status_check
  CHECK (status IN (
    'applied',
    'confirmed',
    'checked_in',
    'completed',
    'pending',
    'accepted',
    'rejected',
    'canceled',
    'on_hold'
  ));
