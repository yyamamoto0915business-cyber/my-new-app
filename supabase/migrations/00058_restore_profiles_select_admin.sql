-- Restore admin SELECT on profiles without RLS recursion.
-- is_developer_admin is SECURITY DEFINER so it does not re-enter profiles RLS.

CREATE OR REPLACE FUNCTION public.is_developer_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'developer_admin'
  );
END;
$$;

ALTER FUNCTION public.is_developer_admin(UUID) OWNER TO postgres;

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT
  USING (public.is_developer_admin(auth.uid()));

NOTIFY pgrst, 'reload schema';
