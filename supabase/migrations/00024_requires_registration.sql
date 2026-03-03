-- events: 参加登録制フラグ・申込締切・申込メモ
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS requires_registration BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_note TEXT;
