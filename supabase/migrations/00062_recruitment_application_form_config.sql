-- 募集: 応募フォーム設定（主催者が聞く項目）
ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS application_form_config JSONB DEFAULT NULL;
