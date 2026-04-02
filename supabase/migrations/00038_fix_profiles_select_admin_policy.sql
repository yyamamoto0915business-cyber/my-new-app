-- Fix: avoid infinite recursion in profiles RLS policy.
-- The previous policy referenced public.profiles from inside a policy on public.profiles,
-- which can trigger "infinite recursion detected in policy for relation \"profiles\"".

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

-- developer_admin は全件参照可（一覧表示用）
-- Use SECURITY DEFINER function to avoid self-referencing profiles policy recursion.
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_developer_admin(auth.uid()));

