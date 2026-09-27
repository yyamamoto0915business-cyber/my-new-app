-- 一緒に作るアルバムの説明文（1行目 blurb / 2行目 lead）
ALTER TABLE public.shared_albums
  ADD COLUMN IF NOT EXISTS blurb TEXT,
  ADD COLUMN IF NOT EXISTS lead TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shared_albums_blurb_len'
  ) THEN
    ALTER TABLE public.shared_albums
      ADD CONSTRAINT shared_albums_blurb_len
      CHECK (blurb IS NULL OR char_length(blurb) BETWEEN 1 AND 80);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shared_albums_lead_len'
  ) THEN
    ALTER TABLE public.shared_albums
      ADD CONSTRAINT shared_albums_lead_len
      CHECK (lead IS NULL OR char_length(lead) BETWEEN 1 AND 40);
  END IF;
END $$;
