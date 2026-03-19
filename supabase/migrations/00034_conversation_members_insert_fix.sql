-- conversation_members_insert_member: RPC(create_or_get_conversation) が両者分を登録できるように緩和
-- participant 側から呼ばれても organizer 側 member 行の INSERT が RLS で落ちないようにする

DROP POLICY IF EXISTS "conversation_members_insert_member" ON public.conversation_members;

CREATE POLICY "conversation_members_insert_member" ON public.conversation_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    JOIN public.organizers o ON o.id = c.organizer_id
    WHERE c.id = conversation_id
      AND (o.profile_id = auth.uid() OR c.other_user_id = auth.uid())
      AND (user_id = o.profile_id OR user_id = c.other_user_id)
  )
);

