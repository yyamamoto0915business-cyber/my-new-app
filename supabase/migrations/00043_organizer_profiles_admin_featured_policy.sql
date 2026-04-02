-- MachiGlyph: developer_admin can update organizer_profiles featured fields

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizer_profiles'
      AND policyname = 'organizer_profiles_update_admin'
  ) THEN
    CREATE POLICY "organizer_profiles_update_admin"
      ON public.organizer_profiles
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'developer_admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizer_profiles'
      AND policyname = 'organizer_profiles_insert_admin'
  ) THEN
    CREATE POLICY "organizer_profiles_insert_admin"
      ON public.organizer_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'developer_admin'
        )
      );
  END IF;
END $$;

