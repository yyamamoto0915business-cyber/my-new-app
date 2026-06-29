-- 繰り返し開催の回数（初回を含む。単発のときは NULL）
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_recurrence_count_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_recurrence_count_check
  CHECK (
    recurrence_count IS NULL
    OR (recurrence_count >= 2 AND recurrence_count <= 52)
  );
