-- TEAM：主催者が TEAM プランでなくなったら、メンバーは使えなくなる（2026-11-15 ユーザー決定）。
-- メンバーの行は消さないので、もう一度 TEAM にすれば元どおり使える。オーナー本人はプランに関係なく今までどおり。
-- TEAM の判定はアプリ（lib/billing.ts の isTeamPlanWithPlanState）と同じ：
--   手動付与が有効で 'team'（期限なし、または期限前）／ Stripe で plan = 'team' かつ支払い中（active・trialing・past_due）
-- 値は organizer_plan_state を優先し、なければ organizers を見る（アプリの mergePlanState と同じ）。

CREATE OR REPLACE FUNCTION public.organizer_team_plan_active(p_organizer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizers o
    LEFT JOIN public.organizer_plan_state ps ON ps.organizer_id = o.id
    WHERE o.id = p_organizer_id
      AND (
        (
          COALESCE(ps.manual_grant_active, o.manual_grant_active, false)
          AND COALESCE(ps.manual_grant_plan, o.manual_grant_plan) = 'team'
          AND (
            COALESCE(ps.manual_grant_expires_at, o.manual_grant_expires_at) IS NULL
            OR COALESCE(ps.manual_grant_expires_at, o.manual_grant_expires_at) > NOW()
          )
        )
        OR (
          o.plan = 'team'
          AND (
            o.subscription_status IN ('active', 'trialing', 'past_due')
            OR ps.stripe_status IN ('active', 'trialing', 'past_due')
          )
        )
      )
  )
$$;
REVOKE ALL ON FUNCTION public.organizer_team_plan_active(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.organizer_team_plan_active(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.organizer_team_plan_active(UUID) TO authenticated, service_role;

-- メンバーとして扱えるのは、その主催者が TEAM のあいだだけ（本人の主催者はいつも）
CREATE OR REPLACE FUNCTION public.my_organizer_ids(p_min_role TEXT DEFAULT 'staff')
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id FROM public.organizers o WHERE o.profile_id = auth.uid()
  UNION
  SELECT m.organizer_id
  FROM public.organizer_members m
  WHERE m.profile_id = auth.uid()
    AND (CASE m.role WHEN 'admin' THEN 3 WHEN 'editor' THEN 2 ELSE 1 END)
        >= (CASE p_min_role WHEN 'admin' THEN 3 WHEN 'editor' THEN 2 ELSE 1 END)
    AND public.organizer_team_plan_active(m.organizer_id)
$$;
