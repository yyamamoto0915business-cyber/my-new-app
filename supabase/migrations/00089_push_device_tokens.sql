-- iOS アプリのプッシュ通知トークン
CREATE TABLE IF NOT EXISTS public.push_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_device_tokens_user_id_idx
  ON public.push_device_tokens (user_id);

ALTER TABLE public.push_device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_device_tokens_select_own" ON public.push_device_tokens;
CREATE POLICY "push_device_tokens_select_own"
  ON public.push_device_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_device_tokens_insert_own" ON public.push_device_tokens;
CREATE POLICY "push_device_tokens_insert_own"
  ON public.push_device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_device_tokens_update_own" ON public.push_device_tokens;
CREATE POLICY "push_device_tokens_update_own"
  ON public.push_device_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_device_tokens_delete_own" ON public.push_device_tokens;
CREATE POLICY "push_device_tokens_delete_own"
  ON public.push_device_tokens FOR DELETE
  USING (auth.uid() = user_id);
