-- avatars バケット作成（公開・画像のみ・1MB制限）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576,
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: 認証ユーザーは自分のフォルダ（user_id）にのみアップロード可能
CREATE POLICY "avatars_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

-- RLS: 公開バケットなので誰でもSELECT可能
CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- RLS: 認証ユーザーは自分のファイルのみUPDATE可能
CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner_id = auth.uid()
);

-- RLS: 認証ユーザーは自分のファイルのみDELETE可能
CREATE POLICY "avatars_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner_id = auth.uid()
);
