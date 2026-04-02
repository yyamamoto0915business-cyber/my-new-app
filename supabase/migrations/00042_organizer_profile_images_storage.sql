-- MachiGlyph: organizer profile images buckets
-- - organizer-covers
-- - organizer-gallery

-- =============================================================================
-- A. organizer-covers
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizer-covers',
  'organizer-covers',
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
      AND policyname = 'organizer_covers_upload_own'
  ) THEN
    CREATE POLICY "organizer_covers_upload_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'organizer-covers'
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
      AND policyname = 'organizer_covers_select_public'
  ) THEN
    CREATE POLICY "organizer_covers_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'organizer-covers');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'organizer_covers_update_own'
  ) THEN
    CREATE POLICY "organizer_covers_update_own"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'organizer-covers'
      AND owner_id = (auth.jwt()->>'sub')
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'organizer_covers_delete_own'
  ) THEN
    CREATE POLICY "organizer_covers_delete_own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'organizer-covers'
      AND owner_id = (auth.jwt()->>'sub')
    );
  END IF;
END $$;

-- =============================================================================
-- B. organizer-gallery
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizer-gallery',
  'organizer-gallery',
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
      AND policyname = 'organizer_gallery_upload_own'
  ) THEN
    CREATE POLICY "organizer_gallery_upload_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'organizer-gallery'
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
      AND policyname = 'organizer_gallery_select_public'
  ) THEN
    CREATE POLICY "organizer_gallery_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'organizer-gallery');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'organizer_gallery_update_own'
  ) THEN
    CREATE POLICY "organizer_gallery_update_own"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'organizer-gallery'
      AND owner_id = (auth.jwt()->>'sub')
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'organizer_gallery_delete_own'
  ) THEN
    CREATE POLICY "organizer_gallery_delete_own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'organizer-gallery'
      AND owner_id = (auth.jwt()->>'sub')
    );
  END IF;
END $$;

