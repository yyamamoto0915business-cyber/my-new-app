-- スタンプラリーなどのゲーム写真

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-images',
  'game-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'game_images_select_public'
  ) THEN
    CREATE POLICY "game_images_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'game-images');
  END IF;
END $$;
