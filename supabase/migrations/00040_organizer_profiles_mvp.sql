-- MachiGlyph: organizer profiles (MVP)
-- - 主催者が編集する公開プロフィール情報（短文/本文/地域/SNS/アバター）
-- - 公開ページ/注目主催者一覧で安全に参照できる VIEW を追加

-- =============================================================================
-- A. organizer_profiles
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.organizer_profiles (
  organizer_id UUID PRIMARY KEY REFERENCES public.organizers(id) ON DELETE CASCADE,

  short_bio TEXT,
  bio TEXT,
  activity_area TEXT,

  avatar_url TEXT,

  website_url TEXT,
  instagram_url TEXT,
  x_url TEXT,
  facebook_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;

-- 公開: 主催者プロフィール情報は誰でも参照可（連絡先は organizers 側に保持し、view には出さない）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizer_profiles'
      AND policyname = 'organizer_profiles_select_public'
  ) THEN
    CREATE POLICY "organizer_profiles_select_public"
      ON public.organizer_profiles FOR SELECT
      USING (true);
  END IF;
END $$;

-- 本人: 自分の organizer に紐づく行のみ INSERT/UPDATE 可
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizer_profiles'
      AND policyname = 'organizer_profiles_insert_own'
  ) THEN
    CREATE POLICY "organizer_profiles_insert_own"
      ON public.organizer_profiles FOR INSERT
      TO authenticated
      WITH CHECK (
        organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizer_profiles'
      AND policyname = 'organizer_profiles_update_own'
  ) THEN
    CREATE POLICY "organizer_profiles_update_own"
      ON public.organizer_profiles FOR UPDATE
      TO authenticated
      USING (
        organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
      );
  END IF;
END $$;

-- updated_at trigger（既存の set_updated_at があれば利用）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'set_updated_at' AND pronamespace = 'public'::regnamespace
  ) THEN
    DROP TRIGGER IF EXISTS set_organizer_profiles_updated_at ON public.organizer_profiles;
    CREATE TRIGGER set_organizer_profiles_updated_at
      BEFORE UPDATE ON public.organizer_profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- =============================================================================
-- B. Public view (safe fields only)
-- =============================================================================
CREATE OR REPLACE VIEW public.organizer_public_profiles AS
SELECT
  o.id AS organizer_id,
  COALESCE(o.organization_name, '主催者') AS organization_name,
  COALESCE(op.avatar_url, p.avatar_url) AS avatar_url,
  op.short_bio,
  op.bio,
  COALESCE(op.activity_area, p.region) AS activity_area,
  op.website_url,
  op.instagram_url,
  op.x_url,
  op.facebook_url
FROM public.organizers o
LEFT JOIN public.organizer_profiles op ON op.organizer_id = o.id
LEFT JOIN public.profiles p ON p.id = o.profile_id;

GRANT SELECT ON public.organizer_public_profiles TO anon, authenticated;

-- =============================================================================
-- C. Storage bucket: organizer-avatars
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizer-avatars',
  'organizer-avatars',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: 認証ユーザーは自分のフォルダ（uid）にのみアップロード可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'organizer_avatars_upload_own'
  ) THEN
    CREATE POLICY "organizer_avatars_upload_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'organizer-avatars'
      AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
    );
  END IF;
END $$;

-- 公開バケットなので誰でも参照可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'organizer_avatars_select_public'
  ) THEN
    CREATE POLICY "organizer_avatars_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'organizer-avatars');
  END IF;
END $$;

-- 自分のファイルのみUPDATE/DELETE可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'organizer_avatars_update_own'
  ) THEN
    CREATE POLICY "organizer_avatars_update_own"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'organizer-avatars'
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
      AND policyname = 'organizer_avatars_delete_own'
  ) THEN
    CREATE POLICY "organizer_avatars_delete_own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'organizer-avatars'
      AND owner_id = (auth.jwt()->>'sub')
    );
  END IF;
END $$;

