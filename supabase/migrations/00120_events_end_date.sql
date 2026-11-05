-- MachiGlyph: 期間イベント（開始日〜終了日）を作れるようにする
-- end_date が NULL のイベントは今までどおり date の1日だけ。
-- 期間イベントはくり返し（毎週・毎月）とは組み合わせない（アプリ側で recurrence = 'none' にする）。

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_end_date_after_start;
ALTER TABLE public.events
  ADD CONSTRAINT events_end_date_after_start
  CHECK (end_date IS NULL OR end_date >= date);

-- 「今日以降に終わるイベント」の絞りこみ用
CREATE INDEX IF NOT EXISTS events_end_date_idx
  ON public.events (end_date)
  WHERE end_date IS NOT NULL;
