-- クイズの正解した問題を、参加者ごとに残す

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS quiz_solved INTEGER[] NOT NULL DEFAULT '{}';

NOTIFY pgrst, 'reload schema';
