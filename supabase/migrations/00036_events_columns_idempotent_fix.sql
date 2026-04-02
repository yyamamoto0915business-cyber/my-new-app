-- 本番などでマイグレーションが途中までしか当たっていない場合の冪等修正。
-- createEvent が参照する events 列を ADD COLUMN IF NOT EXISTS で揃える。
-- db push または SQL Editor でそのまま実行可。

-- 参加登録・締切（00024 相当）
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS requires_registration BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_note TEXT;

-- 参加方式（00029 相当）
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS participation_mode TEXT DEFAULT 'none';

-- 公開状態（00028 相当）
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsor_enabled BOOLEAN DEFAULT true;

UPDATE public.events SET status = 'draft' WHERE status IS NULL;

-- その他（アプリが INSERT する列）
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS prefecture TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsor_ticket_prices INTEGER[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsor_perks JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS priority_slots INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS english_guide_available BOOLEAN;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;
