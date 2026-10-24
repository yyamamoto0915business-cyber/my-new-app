-- ゲームの参加コード（QR を読めないときに、アプリで短いコードを入れて参加する）

ALTER TABLE public.organizer_games
  ADD COLUMN IF NOT EXISTS join_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS organizer_games_join_code_key
  ON public.organizer_games (join_code)
  WHERE join_code IS NOT NULL;

NOTIFY pgrst, 'reload schema';
