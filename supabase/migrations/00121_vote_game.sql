-- MachiGlyph: 投票ゲーム（案を集める → 候補から投票 → 結果発表）
-- 参加者の書きこみはサーバー（サービスロール）からだけ入れる。参加者・主催者が直接読み書きしないので RLS を有効にしてポリシーは作らない。

ALTER TABLE public.organizer_games
  DROP CONSTRAINT IF EXISTS organizer_games_type_check;
ALTER TABLE public.organizer_games
  ADD CONSTRAINT organizer_games_type_check
  CHECK (type IN ('stamp', 'quiz', 'mystery', 'mission', 'photo', 'coupon', 'checkin', 'vote'));

-- 案（参加者が送ったもの・主催者が足した候補）
CREATE TABLE IF NOT EXISTS public.organizer_vote_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.organizer_games(id) ON DELETE CASCADE,
  -- 主催者が足した候補は NULL
  player_id UUID REFERENCES public.organizer_game_players(id) ON DELETE CASCADE,
  nickname TEXT,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 200),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 300),
  -- 主催者が隠した案は、参加者にも結果にも出さない
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  -- 投票の候補にしたか
  is_candidate BOOLEAN NOT NULL DEFAULT FALSE,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organizer_vote_ideas_game_idx
  ON public.organizer_vote_ideas (game_id, created_at DESC);

-- 票（1人が同じ候補に入れられるのは1回。何票まで入れられるかはゲームの設定で決める）
CREATE TABLE IF NOT EXISTS public.organizer_vote_ballots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.organizer_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.organizer_game_players(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.organizer_vote_ideas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, player_id, idea_id)
);

CREATE INDEX IF NOT EXISTS organizer_vote_ballots_game_idx
  ON public.organizer_vote_ballots (game_id, idea_id);

-- 案の通報（同じ人が同じ案を何度も通報しても1回）
CREATE TABLE IF NOT EXISTS public.organizer_vote_reports (
  idea_id UUID NOT NULL REFERENCES public.organizer_vote_ideas(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.organizer_game_players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (idea_id, player_id)
);

ALTER TABLE public.organizer_vote_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_vote_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_vote_reports ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
