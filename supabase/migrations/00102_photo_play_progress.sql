-- フォトラリーで記録したスポットを、参加者ごとに残す

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS photo_done INTEGER[] NOT NULL DEFAULT '{}';

NOTIFY pgrst, 'reload schema';
