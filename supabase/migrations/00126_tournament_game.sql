-- MachiGlyph: トーナメント表（勝ち抜き・リーグ戦）。出場者はゲームの設定、試合の結果はこの表に入れる。
-- 書きこみはサーバー（サービスロール）からだけ。RLS を有効にしてポリシーは作らない。

ALTER TABLE public.organizer_games
  DROP CONSTRAINT IF EXISTS organizer_games_type_check;
ALTER TABLE public.organizer_games
  ADD CONSTRAINT organizer_games_type_check
  CHECK (type IN ('stamp', 'quiz', 'mystery', 'mission', 'photo', 'coupon', 'checkin', 'vote', 'lottery', 'survey', 'tournament'));

CREATE TABLE IF NOT EXISTS public.organizer_tournament_results (
  game_id UUID NOT NULL REFERENCES public.organizer_games(id) ON DELETE CASCADE,
  -- K{回戦}-{番号}（勝ち抜き）／ L{番号}-{番号}（リーグ戦）
  match_key TEXT NOT NULL CHECK (char_length(match_key) BETWEEN 2 AND 20),
  -- 勝った出場者の番号。リーグ戦の引き分けは NULL
  winner INTEGER CHECK (winner IS NULL OR winner >= 0),
  score_a INTEGER CHECK (score_a IS NULL OR score_a BETWEEN 0 AND 999),
  score_b INTEGER CHECK (score_b IS NULL OR score_b BETWEEN 0 AND 999),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (game_id, match_key)
);

ALTER TABLE public.organizer_tournament_results ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
