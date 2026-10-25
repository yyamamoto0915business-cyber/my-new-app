-- content_reports は 00057（管理画面）で先に作られていたため、00116 の CREATE TABLE が効かなかった。
-- 通報機能で使う形にそろえる（既存の列は残す）

ALTER TABLE public.content_reports
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS detail TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS handled_at TIMESTAMPTZ;

-- デモ投稿など uuid 以外の id も受け付ける
ALTER TABLE public.content_reports
  ALTER COLUMN target_id TYPE TEXT USING target_id::text;

-- status の選択肢に hidden（非表示にした）を足す
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.content_reports'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.content_reports DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.content_reports
  ADD CONSTRAINT content_reports_status_check
  CHECK (status IN ('open', 'in_progress', 'resolved', 'hidden', 'dismissed'));

-- 同じ人が同じものを何度も通報しても1件にする
CREATE UNIQUE INDEX IF NOT EXISTS content_reports_once_per_reporter
  ON public.content_reports (reporter_id, target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_status_created
  ON public.content_reports (status, created_at DESC);

-- API から見える列を更新する
NOTIFY pgrst, 'reload schema';
