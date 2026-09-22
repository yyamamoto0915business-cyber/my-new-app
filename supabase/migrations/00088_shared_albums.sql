-- 一緒に作るアルバム（メンバーと写真の共有コレクション）

CREATE TABLE IF NOT EXISTS public.shared_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_url TEXT,
  invite_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shared_albums_title_len CHECK (char_length(title) BETWEEN 1 AND 40)
);

CREATE INDEX IF NOT EXISTS idx_shared_albums_owner
  ON public.shared_albums (owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.shared_album_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.shared_albums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shared_album_members_unique UNIQUE (album_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_album_members_user
  ON public.shared_album_members (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.shared_album_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.shared_albums(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shared_album_items_unique UNIQUE (album_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_album_items_album
  ON public.shared_album_items (album_id, created_at DESC);

ALTER TABLE public.shared_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_album_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_album_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shared_albums'
      AND policyname = 'shared_albums_select_member'
  ) THEN
    CREATE POLICY "shared_albums_select_member"
      ON public.shared_albums FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.shared_album_members m
          WHERE m.album_id = shared_albums.id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shared_album_members'
      AND policyname = 'shared_album_members_select_own'
  ) THEN
    CREATE POLICY "shared_album_members_select_own"
      ON public.shared_album_members FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shared_album_items'
      AND policyname = 'shared_album_items_select_member'
  ) THEN
    CREATE POLICY "shared_album_items_select_member"
      ON public.shared_album_items FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.shared_album_members m
          WHERE m.album_id = shared_album_items.album_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;
