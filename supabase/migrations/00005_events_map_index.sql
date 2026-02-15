-- 地図表示用インデックス（latitude, longitude が NULL でないイベントの検索を高速化）
CREATE INDEX IF NOT EXISTS idx_events_lat_lng
  ON public.events(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_date
  ON public.events(date);
