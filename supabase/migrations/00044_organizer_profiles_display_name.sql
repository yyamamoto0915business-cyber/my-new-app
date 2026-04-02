-- MachiGlyph: organizer_profiles.display_name (requested field)

ALTER TABLE public.organizer_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

