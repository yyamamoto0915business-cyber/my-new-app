-- profiles: デフォルト表示モード（参加する/手伝う/主催する）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_mode TEXT DEFAULT 'participant'
  CHECK (default_mode IN ('participant', 'volunteer', 'organizer'));

-- 既存ユーザーは participant を初期値に
UPDATE public.profiles SET default_mode = 'participant' WHERE default_mode IS NULL;
