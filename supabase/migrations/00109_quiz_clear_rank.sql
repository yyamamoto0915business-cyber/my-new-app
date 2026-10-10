-- クイズをクリアした時刻を一度だけ残し、先に終えた人から順位を数える

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS quiz_cleared_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
