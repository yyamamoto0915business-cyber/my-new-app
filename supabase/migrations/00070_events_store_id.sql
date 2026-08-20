-- MachiGlyph: イベントと店舗の紐づけ（events.store_id）

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_store_id ON public.events (store_id);
