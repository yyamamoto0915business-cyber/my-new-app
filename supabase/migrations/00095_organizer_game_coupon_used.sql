-- スタンプラリーのクーポンを、参加者ごとに使用済みにする

ALTER TABLE public.organizer_game_players
  ADD COLUMN IF NOT EXISTS coupon_used_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
