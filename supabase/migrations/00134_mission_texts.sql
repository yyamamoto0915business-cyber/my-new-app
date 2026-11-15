-- ミッションの「文字で送る」で、参加者が送った文字を残す（ミッションの番号 → { text, at }）
-- 見られるのは今までの参加者の行と同じ（主催者は自分のゲームの参加者だけ）。

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS mission_texts JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
