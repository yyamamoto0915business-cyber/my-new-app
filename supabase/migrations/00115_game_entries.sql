-- ゲーム単体の申し込み（イベントを作らずに、ゲームだけで申し込みを受け付ける）

CREATE TABLE IF NOT EXISTS public.organizer_game_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.organizer_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS organizer_game_entries_user_idx
  ON public.organizer_game_entries (user_id);

-- 読み書きはサーバー（service role）からだけ行う。
ALTER TABLE public.organizer_game_entries ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
