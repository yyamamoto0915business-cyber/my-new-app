-- MachiGlyph: 店舗画像用 Storage バケット（store-images）

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-images',
  'store-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
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
      AND policyname = 'store_images_upload_own'
  ) THEN
    CREATE POLICY "store_images_upload_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'store-images'
      AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'store_images_select_public'
  ) THEN
    CREATE POLICY "store_images_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'store-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'store_images_delete_own'
  ) THEN
    CREATE POLICY "store_images_delete_own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'store-images'
      AND owner_id = (auth.jwt()->>'sub')
    );
  END IF;
END $$;
