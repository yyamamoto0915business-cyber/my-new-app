-- user_points: ユーザーポイント残高
CREATE TABLE IF NOT EXISTS public.user_points (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- point_transactions: ポイント履歴
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'exchange')),
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- organizer_plans: 料金プラン（organizers.plan で管理、このテーブルは定義のみ）
-- free: 月2件, light: 無制限+リマインド, standard: +募集+証明書+レポート

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_points_select_own" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_points_update_own" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_points_insert" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "point_transactions_select_own" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id);
