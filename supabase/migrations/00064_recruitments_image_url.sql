-- recruitments: アイキャッチ画像（任意）
ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS image_url TEXT;
