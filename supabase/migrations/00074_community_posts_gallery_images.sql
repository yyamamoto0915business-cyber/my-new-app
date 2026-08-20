-- 写真投稿の複数枚ギャラリー
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT '{}';
