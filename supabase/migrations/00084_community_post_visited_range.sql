-- みんなの投稿：行った日（任意の期間）。アルバムの年・季節はこちらを優先する
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS visited_from DATE,
  ADD COLUMN IF NOT EXISTS visited_to DATE;

ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_visited_to_requires_from_check;
ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_visited_to_requires_from_check
  CHECK (visited_to IS NULL OR visited_from IS NOT NULL);

ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_visited_range_check;
ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_visited_range_check
  CHECK (
    visited_from IS NULL
    OR visited_to IS NULL
    OR visited_to >= visited_from
  );
