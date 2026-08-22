-- 投稿の関連リンクと OGP プレビュー（本文末尾埋め込みから分離）
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS related_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS related_title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS related_image_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS related_site_name TEXT NOT NULL DEFAULT '';
