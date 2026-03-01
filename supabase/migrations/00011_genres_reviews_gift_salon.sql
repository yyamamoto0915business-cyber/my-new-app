-- event_genres: ジャンルマスタ（地域イベント向け）
CREATE TABLE IF NOT EXISTS public.event_genres (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.event_genres (id, label, sort_order) VALUES
  ('regional', '地域活性化', 1),
  ('culture', '文化体験', 2),
  ('environment', '環境保全', 3),
  ('disaster', '防災・安全教育', 4),
  ('parenting', '子育て支援', 5),
  ('volunteer', 'ボランティア', 6),
  ('food', '食・農業', 7),
  ('sports', 'スポーツ・健康', 8),
  ('art', 'アート・クラフト', 9),
  ('history', '歴史・伝統', 10)
ON CONFLICT (id) DO NOTHING;

-- events: 画像・ジャンル・説明・表示順・サロン限定
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS genre_id TEXT REFERENCES public.event_genres(id),
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salon_only BOOLEAN DEFAULT false;

-- event_reviews: 参加者レビュー（満足度・コメント）
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_reviews_select_all" ON public.event_reviews FOR SELECT USING (true);
CREATE POLICY "event_reviews_insert_own" ON public.event_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_reviews_update_own" ON public.event_reviews FOR UPDATE USING (auth.uid() = user_id);
