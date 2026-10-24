-- ミッションの「写真を投稿」で、参加者が送った写真を残す（ミッションの番号 → { url, at }）

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS mission_photos JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';

-- ミッションの「友だちと参加」：ふたりで同じ合言葉を入れるのを待つあいだの記録（ミッションの番号 → { hash, at }）
ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS mission_pairs JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
