-- post-media バケット（みんなの投稿・15秒動画）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  26214400,
  ARRAY['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp']
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
      AND policyname = 'post_media_upload_own'
  ) THEN
    CREATE POLICY "post_media_upload_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'post-media'
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
      AND policyname = 'post_media_select_public'
  ) THEN
    CREATE POLICY "post_media_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'post-media');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'post_media_delete_own'
  ) THEN
    CREATE POLICY "post_media_delete_own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'post-media'
      AND owner_id = (auth.jwt()->>'sub')
    );
  END IF;
END $$;
