-- みんなの投稿カテゴリを、投稿したくなる体験の名前に揃える。
-- event=まつり / spot=おでかけ / kitchen=ごはん / scenery=景色 / trip=旅行
-- 旧 shop（お店）は来店の記録として spot に寄せる。

ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_category_check;

UPDATE public.community_posts
SET category = 'spot'
WHERE category = 'shop';

ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_category_check
  CHECK (category IN ('event', 'spot', 'kitchen', 'scenery', 'trip'));
