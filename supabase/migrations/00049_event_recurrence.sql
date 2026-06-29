-- イベントの開催パターン（単発 / 毎週 / 毎月）
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_recurrence_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_recurrence_check
  CHECK (recurrence IN ('none', 'weekly', 'monthly'));
