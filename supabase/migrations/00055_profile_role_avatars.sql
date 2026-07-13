ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS participant_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS organizer_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS active_profile_role TEXT
    CHECK (active_profile_role IN ('participant', 'organizer'));

UPDATE public.profiles
SET active_profile_role = COALESCE(active_profile_role, 'participant')
WHERE active_profile_role IS NULL;

-- 既存 avatar_url があるユーザーは参加者アイコンに引き継ぐ
UPDATE public.profiles
SET participant_avatar_url = COALESCE(participant_avatar_url, avatar_url)
WHERE avatar_url IS NOT NULL;
