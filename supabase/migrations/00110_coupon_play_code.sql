-- クーポンラリーのクリアコードを、参加者ごとに一度だけ残す

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

NOTIFY pgrst, 'reload schema';
