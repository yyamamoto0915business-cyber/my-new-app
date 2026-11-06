-- MachiGlyph: 抽選ゲーム（参加した人の中から、賞ごとにランダムで当選者を選ぶ）
-- 書きこみはサーバー（サービスロール）からだけ。RLS を有効にしてポリシーは作らない。

ALTER TABLE public.organizer_games
  DROP CONSTRAINT IF EXISTS organizer_games_type_check;
ALTER TABLE public.organizer_games
  ADD CONSTRAINT organizer_games_type_check
  CHECK (type IN ('stamp', 'quiz', 'mystery', 'mission', 'photo', 'coupon', 'checkin', 'vote', 'lottery'));

-- 当選（主催者が「引き直す」と voided になり、別の人を選び直す）
CREATE TABLE IF NOT EXISTS public.organizer_lottery_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.organizer_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.organizer_game_players(id) ON DELETE CASCADE,
  prize_index INTEGER NOT NULL CHECK (prize_index >= 0),
  prize_label TEXT NOT NULL CHECK (char_length(prize_label) BETWEEN 1 AND 60),
  voided BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1人が当たるのは1つの賞まで（引き直しで無効になったものは数えない）
CREATE UNIQUE INDEX IF NOT EXISTS organizer_lottery_wins_one_per_player
  ON public.organizer_lottery_wins (game_id, player_id)
  WHERE NOT voided;

CREATE INDEX IF NOT EXISTS organizer_lottery_wins_game_idx
  ON public.organizer_lottery_wins (game_id, prize_index, created_at);

ALTER TABLE public.organizer_lottery_wins ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
