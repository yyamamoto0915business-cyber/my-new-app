-- イベント・募集: 詳細ギャラリー用の追加画像（代表 image_url とは別）
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
