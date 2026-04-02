-- MachiGlyph: organizer profiles (next step)
-- - cover / gallery / categories / public contacts / featured flags

-- =============================================================================
-- A. organizer_profiles: columns
-- =============================================================================
ALTER TABLE public.organizer_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS public_email TEXT,
  ADD COLUMN IF NOT EXISTS public_phone TEXT,
  ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_rank INTEGER;

-- ざっくりした長さ制約（MVP範囲で暴走を防ぐ）
ALTER TABLE public.organizer_profiles
  DROP CONSTRAINT IF EXISTS organizer_profiles_short_bio_len_check;
ALTER TABLE public.organizer_profiles
  ADD CONSTRAINT organizer_profiles_short_bio_len_check
    CHECK (short_bio IS NULL OR char_length(short_bio) <= 120);

-- =============================================================================
-- B. public view: include new safe fields (and conditional contacts)
-- カラム追加によりCREATE OR REPLACEでは列順が変わるためDROP→再作成
-- =============================================================================
DROP VIEW IF EXISTS public.organizer_public_profiles;
CREATE VIEW public.organizer_public_profiles AS
SELECT
  o.id AS organizer_id,
  COALESCE(op.display_name, o.organization_name, '主催者') AS organization_name,

  COALESCE(op.avatar_url, p.avatar_url) AS avatar_url,
  op.cover_image_url,
  op.gallery_images,
  op.categories,

  op.short_bio,
  op.bio,
  COALESCE(op.activity_area, p.region) AS activity_area,

  op.website_url,
  op.instagram_url,
  op.x_url,
  op.facebook_url,

  CASE WHEN op.show_email THEN op.public_email ELSE NULL END AS public_email,
  CASE WHEN op.show_phone THEN op.public_phone ELSE NULL END AS public_phone
FROM public.organizers o
LEFT JOIN public.organizer_profiles op ON op.organizer_id = o.id
LEFT JOIN public.profiles p ON p.id = o.profile_id;

GRANT SELECT ON public.organizer_public_profiles TO anon, authenticated;

-- =============================================================================
-- C. indexes (featured)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_is_featured
  ON public.organizer_profiles(is_featured);
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_featured_rank
  ON public.organizer_profiles(featured_rank);

