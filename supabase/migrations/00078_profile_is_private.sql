-- アカウント非公開フラグ（default false = 公開。公開時はフォロー承認不要）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "user_follows_insert_own" ON public.user_follows;
CREATE POLICY "user_follows_insert_own"
  ON public.user_follows FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_id = auth.uid()
    AND status IN ('pending', 'accepted')
  );
