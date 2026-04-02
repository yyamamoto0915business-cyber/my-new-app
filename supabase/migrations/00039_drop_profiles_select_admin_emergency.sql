-- Emergency fix:
-- If "infinite recursion detected in policy for relation \"profiles\"" persists,
-- remove the admin-wide profiles SELECT policy which can trigger recursion.
--
-- This restores normal user flows (profiles_select_own) at the cost of
-- disabling "developer_admin can read all profiles" behavior until reworked
-- with non-recursive checks (e.g., JWT custom claims or a dedicated admin table).

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

