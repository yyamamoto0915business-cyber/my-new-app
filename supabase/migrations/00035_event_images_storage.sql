-- event-images バケット作成（公開・画像のみ・10MB制限）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: 認証ユーザーは自分のフォルダ（uid）にのみアップロード可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'event_images_upload_own'
  ) THEN
    CREATE POLICY "event_images_upload_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'event-images'
      AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
    );
  END IF;
END $$;

-- RLS: 公開バケットなので誰でも参照可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'event_images_select_public'
  ) THEN
    CREATE POLICY "event_images_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'event-images');
  END IF;
END $$;

-- RLS: 自分のファイルのみ削除可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'event_images_delete_own'
  ) THEN
    CREATE POLICY "event_images_delete_own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'event-images'
      AND owner_id = (auth.jwt()->>'sub')
    );
  END IF;
END $$;
