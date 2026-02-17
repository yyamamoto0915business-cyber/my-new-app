-- recruitments: 技術ボランティア種別
ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS tech_role TEXT;
