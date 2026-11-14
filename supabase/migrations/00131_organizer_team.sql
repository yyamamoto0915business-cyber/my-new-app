-- TEAM：主催者が招待したメンバーも、同じ主催者のデータを扱えるようにする（見本 03・07・08）。
-- 役割：admin（管理者：すべて・メンバー管理・プラン）／ editor（編集者：掲載の作成・編集・応募の管理）／ staff（スタッフ：当日の受付・レジ）
-- 主催者アカウントの本人（organizers.profile_id）は、いつもすべてできる（管理者より上）。
--
-- 今までのルール（RLS）は「organizer_id IN (SELECT id FROM organizers WHERE profile_id = auth.uid())」＝本人だけ、で書かれている。
-- これを「本人＋メンバー（必要な役割以上）」に切りかえる。書き方がそろっているので、pg_policies を読んで機械的に置きかえる。
-- チャット（chat_*・conversations）は本人だけのまま（メンバーに個人のやり取りを見せないため）。
-- これから作るルールも、本人だけの書き方ではなく public.my_organizer_ids('<役割>') を使うこと。

-- 1) メンバー
CREATE TABLE IF NOT EXISTS public.organizer_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'staff')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organizer_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_organizer_members_profile ON public.organizer_members (profile_id);

-- 2) 招待リンク（トークンを知っている人が、ログインして参加する）
CREATE TABLE IF NOT EXISTS public.organizer_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'staff')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses BETWEEN 1 AND 20),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organizer_invites_org ON public.organizer_invites (organizer_id);

-- 3) 自分が扱える主催者（本人の主催者＋メンバーになっている主催者のうち、p_min_role 以上の役割のもの）
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
$$;
REVOKE ALL ON FUNCTION public.my_organizer_ids(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_organizer_ids(TEXT) TO authenticated, service_role;

-- 4) メンバー・招待の表のルール（書くのはアプリのサーバーだけ。読むのは同じ主催者のメンバー）
ALTER TABLE public.organizer_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_invites ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizer_members' AND policyname = 'organizer_members_select_team') THEN
    CREATE POLICY "organizer_members_select_team" ON public.organizer_members FOR SELECT TO authenticated
      USING (profile_id = auth.uid() OR organizer_id IN (SELECT public.my_organizer_ids('staff')));
  END IF;
  -- メンバーは、所属する主催者の行（団体名・プランなど）を読める。書き換えは今までどおり本人だけ
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizers' AND policyname = 'organizers_select_member') THEN
    CREATE POLICY "organizers_select_member" ON public.organizers FOR SELECT TO authenticated
      USING (id IN (SELECT public.my_organizer_ids('staff')));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizer_invites' AND policyname = 'organizer_invites_select_admin') THEN
    CREATE POLICY "organizer_invites_select_admin" ON public.organizer_invites FOR SELECT TO authenticated
      USING (organizer_id IN (SELECT public.my_organizer_ids('admin')));
  END IF;
END $$;

-- 5) 今までの「本人だけ」のルールを、「本人＋メンバー」に置きかえる
--    読む（SELECT）：スタッフ以上。プランの表だけは管理者以上
--    書く（INSERT・UPDATE・DELETE）：当日の受付・レジの表はスタッフ以上、それ以外は編集者以上
DO $$
DECLARE
  r RECORD;
  v_role TEXT;
  v_qual TEXT;
  v_check TEXT;
  v_std CONSTANT TEXT := '\(\s*SELECT\s+organizers\.id\s+FROM\s+organizers\s+WHERE\s+\(organizers\.profile_id\s*=\s*auth\.uid\(\)\)\s*\)';
  v_alias CONSTANT TEXT := '\(o\.profile_id\s*=\s*auth\.uid\(\)\)';
  v_sql TEXT;
BEGIN
  FOR r IN
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename NOT IN ('chat_messages', 'chat_rooms', 'conversations', 'conversation_members', 'organizer_members', 'organizer_invites')
      AND (coalesce(qual, '') ~ v_std OR coalesce(with_check, '') ~ v_std)
  LOOP
    IF r.tablename IN ('organizer_plan_state', 'organizer_subscriptions') THEN
      v_role := 'admin';
    ELSIF r.cmd = 'SELECT' THEN
      v_role := 'staff';
    ELSIF r.tablename IN ('pos_sales', 'pos_sale_items', 'event_participants', 'event_checkins', 'recruitment_applications', 'organizer_game_players') THEN
      v_role := 'staff';
    ELSE
      v_role := 'editor';
    END IF;

    v_qual := r.qual;
    v_check := r.with_check;
    IF v_qual IS NOT NULL THEN
      v_qual := regexp_replace(v_qual, v_std, format('( SELECT public.my_organizer_ids(%L))', v_role), 'g');
      v_qual := regexp_replace(v_qual, v_alias, format('(o.id IN ( SELECT public.my_organizer_ids(%L)))', v_role), 'g');
    END IF;
    IF v_check IS NOT NULL THEN
      v_check := regexp_replace(v_check, v_std, format('( SELECT public.my_organizer_ids(%L))', v_role), 'g');
      v_check := regexp_replace(v_check, v_alias, format('(o.id IN ( SELECT public.my_organizer_ids(%L)))', v_role), 'g');
    END IF;

    v_sql := format('ALTER POLICY %I ON public.%I', r.policyname, r.tablename);
    IF v_qual IS NOT NULL THEN
      v_sql := v_sql || format(' USING (%s)', v_qual);
    END IF;
    IF v_check IS NOT NULL THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_check);
    END IF;
    EXECUTE v_sql;
  END LOOP;
END $$;
