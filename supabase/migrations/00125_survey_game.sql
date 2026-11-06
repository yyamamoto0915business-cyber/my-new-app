-- MachiGlyph: アンケート（選択・5段階・自由記述で答えてもらい、主催者が集計を見る）
-- 書きこみはサーバー（サービスロール）からだけ。RLS を有効にしてポリシーは作らない。

ALTER TABLE public.organizer_games
  DROP CONSTRAINT IF EXISTS organizer_games_type_check;
ALTER TABLE public.organizer_games
  ADD CONSTRAINT organizer_games_type_check
  CHECK (type IN ('stamp', 'quiz', 'mystery', 'mission', 'photo', 'coupon', 'checkin', 'vote', 'lottery', 'survey'));

-- 答え（1人1件。受付中は直せる）
CREATE TABLE IF NOT EXISTS public.organizer_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.organizer_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.organizer_game_players(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, player_id)
);

CREATE INDEX IF NOT EXISTS organizer_survey_responses_game_idx
  ON public.organizer_survey_responses (game_id, created_at);

ALTER TABLE public.organizer_survey_responses ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
