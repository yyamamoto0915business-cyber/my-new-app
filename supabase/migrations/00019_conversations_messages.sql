-- LINE風1対1チャット: conversations / conversation_members / messages
-- eventId + kind + organizerId + otherUserId で一意

-- conversations: 会話（イベント×主催者×相手ユーザで一意）
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'event_inquiry' CHECK (kind IN ('event_inquiry', 'general')),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX conversations_unique_key ON public.conversations (
  COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid),
  kind,
  organizer_id,
  other_user_id
);

-- conversation_members: 会話メンバー（last_read_at で未読管理）
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- messages: メッセージ
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_conversation_id_created_at ON public.messages (conversation_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS: 会話メンバーのみアクセス可能
-- conversations: メンバーのみ SELECT
CREATE POLICY "conversations_select_member" ON public.conversations FOR SELECT USING (
  id IN (
    SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid()
  )
);

-- conversations: INSERT は組織者が作成時のみ（upsert API 経由で service role を使う想定、または INSERT policy）
-- アプリでは API 経由で upsert するため、RLS の INSERT は許可しない（service role または RPC で実行）
-- ここでは「自分がメンバーになる会話」のみ INSERT 許可（conversation_members 経由でメンバーになる）
CREATE POLICY "conversations_insert_member" ON public.conversations FOR INSERT WITH CHECK (
  -- organizer の profile_id か other_user_id のどちらかが auth.uid() であること
  (
    organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
    OR other_user_id = auth.uid()
  )
);

-- conversation_members: メンバーのみ SELECT、自分の行のみ UPDATE
CREATE POLICY "conversation_members_select_member" ON public.conversation_members FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
    OR other_user_id = auth.uid()
  )
);

CREATE POLICY "conversation_members_insert_member" ON public.conversation_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND conversation_id IN (
    SELECT id FROM public.conversations
    WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
    OR other_user_id = auth.uid()
  )
);

CREATE POLICY "conversation_members_update_own" ON public.conversation_members FOR UPDATE USING (
  user_id = auth.uid()
);

-- messages: 会話メンバーのみ SELECT、本人のみ INSERT
CREATE POLICY "messages_select_member" ON public.messages FOR SELECT USING (
  conversation_id IN (
    SELECT cm.conversation_id FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND conversation_id IN (
    SELECT cm.conversation_id FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
  )
);

-- Realtime: messages の INSERT を購読可能に
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- get_inbox(): トーク一覧（最終メッセージ・未読件数・相手プロフィール）
CREATE OR REPLACE FUNCTION public.get_inbox(p_limit INT DEFAULT 50)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_display_name TEXT,
  other_avatar_url TEXT,
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH my_conversations AS (
    SELECT cm.conversation_id, cm.last_read_at
    FROM public.conversation_members cm
    WHERE cm.user_id = auth.uid()
  ),
  last_msgs AS (
    SELECT
      m.conversation_id,
      m.content AS last_content,
      m.created_at AS last_at,
      ROW_NUMBER() OVER (PARTITION BY m.conversation_id ORDER BY m.created_at DESC) AS rn
    FROM public.messages m
    WHERE m.conversation_id IN (SELECT conversation_id FROM my_conversations)
  ),
  unread AS (
    SELECT
      mc.conversation_id,
      COUNT(*)::BIGINT AS cnt
    FROM my_conversations mc
    JOIN public.messages m ON m.conversation_id = mc.conversation_id
    WHERE m.sender_id != auth.uid()
    AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
    GROUP BY mc.conversation_id
  ),
  other_users AS (
    -- 会話の相手: 自分が organizer なら other_user_id、自分が other なら organizer の profile_id
    SELECT
      c.id AS conv_id,
      CASE
        WHEN o.profile_id = auth.uid() THEN c.other_user_id
        ELSE o.profile_id
      END AS other_id
    FROM public.conversations c
    JOIN public.organizers o ON o.id = c.organizer_id
    WHERE c.id IN (SELECT conversation_id FROM my_conversations)
  )
  SELECT
    ou.conv_id AS conversation_id,
    ou.other_id AS other_user_id,
    p.display_name AS other_display_name,
    p.avatar_url AS other_avatar_url,
    lm.last_content AS last_message_content,
    lm.last_at AS last_message_at,
    COALESCE(u.cnt, 0)::BIGINT AS unread_count
  FROM other_users ou
  JOIN public.profiles p ON p.id = ou.other_id
  LEFT JOIN last_msgs lm ON lm.conversation_id = ou.conv_id AND lm.rn = 1
  LEFT JOIN unread u ON u.conversation_id = ou.conv_id
  ORDER BY lm.last_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS で get_inbox の実行を認証ユーザーに限定
REVOKE EXECUTE ON FUNCTION public.get_inbox(INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_inbox(INT) TO authenticated;

-- create_or_get_conversation: eventId + kind + organizerId + otherUserId で upsert、2人分メンバー追加
CREATE OR REPLACE FUNCTION public.create_or_get_conversation(
  p_event_id UUID,
  p_kind TEXT,
  p_organizer_id UUID,
  p_other_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conv_id UUID;
  v_organizer_profile_id UUID;
BEGIN
  -- 呼び出し者は organizer または other_user のどちらかであること
  SELECT profile_id INTO v_organizer_profile_id FROM public.organizers WHERE id = p_organizer_id;
  IF v_organizer_profile_id IS NULL THEN
    RAISE EXCEPTION 'organizer not found';
  END IF;
  IF auth.uid() != v_organizer_profile_id AND auth.uid() != p_other_user_id THEN
    RAISE EXCEPTION 'not allowed to create this conversation';
  END IF;

  INSERT INTO public.conversations (event_id, kind, organizer_id, other_user_id)
  VALUES (
    NULLIF(p_event_id, '00000000-0000-0000-0000-000000000000'::uuid),
    p_kind,
    p_organizer_id,
    p_other_user_id
  )
  ON CONFLICT ((COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid)), kind, organizer_id, other_user_id)
  DO NOTHING;

  SELECT id INTO v_conv_id FROM public.conversations
  WHERE COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(NULLIF(p_event_id, '00000000-0000-0000-0000-000000000000'::uuid), '00000000-0000-0000-0000-000000000000'::uuid)
    AND kind = p_kind AND organizer_id = p_organizer_id AND other_user_id = p_other_user_id;

  -- conversation_members を2人分 upsert
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (v_conv_id, v_organizer_profile_id), (v_conv_id, p_other_user_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.create_or_get_conversation(UUID, TEXT, UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation(UUID, TEXT, UUID, UUID) TO authenticated;
