-- conversations SELECT と conversation_members SELECT が相互参照し、
-- 「infinite recursion detected in policy for relation "conversations"」になるのを防ぐ。
--
-- 旧: conversation_members を読むために conversations を SELECT（RLS 再帰）
-- 新: 自分がメンバーである行（user_id = auth.uid()）だけ見える。会話本体は
--     conversations_select_member が conversation_members 経由で許可する（一方通行）。

DROP POLICY IF EXISTS "conversation_members_select_member" ON public.conversation_members;

CREATE POLICY "conversation_members_select_member" ON public.conversation_members
FOR SELECT
USING (user_id = auth.uid());
