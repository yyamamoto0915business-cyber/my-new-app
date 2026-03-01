-- articles: ストーリー記事（note風、誰でも書ける）
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- article_likes: 記事いいね
CREATE TABLE IF NOT EXISTS public.article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles_select_published" ON public.articles FOR SELECT USING (
  status = 'published' OR author_id = auth.uid()
);
CREATE POLICY "articles_insert_own" ON public.articles FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "articles_update_own" ON public.articles FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "articles_delete_own" ON public.articles FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "article_likes_select_all" ON public.article_likes FOR SELECT USING (true);
CREATE POLICY "article_likes_insert_own" ON public.article_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "article_likes_delete_own" ON public.article_likes FOR DELETE USING (auth.uid() = user_id);
