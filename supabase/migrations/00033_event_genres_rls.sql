-- event_genres: RLS を有効化（読み取りのみ全ユーザーに許可）
ALTER TABLE public.event_genres ENABLE ROW LEVEL SECURITY;

-- 全員が SELECT 可能（マスタ参照用）
CREATE POLICY "event_genres_select_all" ON public.event_genres
  FOR SELECT USING (true);
