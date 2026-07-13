-- 参加パス設定（申込方法は既存 participation_mode を利用）
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IS NULL OR payment_method IN ('online', 'onsite', 'both')),
  ADD COLUMN IF NOT EXISTS check_in_method TEXT
    CHECK (check_in_method IS NULL OR check_in_method IN ('qr', 'manual')),
  ADD COLUMN IF NOT EXISTS pass_configured BOOLEAN DEFAULT false;
