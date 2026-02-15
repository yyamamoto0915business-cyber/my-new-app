-- 1:1 チャット対応: participant_id を追加
ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- イベント×参加者ごとに1ルーム
CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_event_participant_key
  ON public.chat_rooms (event_id, participant_id)
  WHERE event_id IS NOT NULL AND participant_id IS NOT NULL;

-- 既存の汎用ポリシーを削除
DROP POLICY IF EXISTS "chat_rooms_select" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_insert" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;

-- chat_rooms: 主催者 or 参加者のみアクセス可能
CREATE POLICY "chat_rooms_select_participant" ON public.chat_rooms FOR SELECT USING (
  participant_id = auth.uid()
  OR
  (event_id IS NOT NULL AND event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizers WHERE profile_id = auth.uid()
    )
  ))
  OR
  (recruitment_id IS NOT NULL AND recruitment_id IN (
    SELECT id FROM public.recruitments WHERE organizer_id IN (
      SELECT id FROM public.organizers WHERE profile_id = auth.uid()
    )
  ))
);

-- ルーム作成: 主催者（eventのorganizer） or 参加者本人（event_participantsに存在）
CREATE POLICY "chat_rooms_insert_participant" ON public.chat_rooms FOR INSERT WITH CHECK (
  event_id IS NOT NULL
  AND participant_id IS NOT NULL
  AND (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id IN (
        SELECT id FROM public.organizers WHERE profile_id = auth.uid()
      )
    )
    OR (
      participant_id = auth.uid()
      AND (event_id, auth.uid()) IN (
        SELECT event_id, user_id FROM public.event_participants
      )
    )
  )
);

-- chat_messages: ルーム参加者のみ読み取り、本人のみ送信
CREATE POLICY "chat_messages_select_room" ON public.chat_messages FOR SELECT USING (
  room_id IN (
    SELECT id FROM public.chat_rooms
    WHERE participant_id = auth.uid()
    OR (event_id IS NOT NULL AND event_id IN (
      SELECT id FROM public.events WHERE organizer_id IN (
        SELECT id FROM public.organizers WHERE profile_id = auth.uid()
      )
    ))
    OR (recruitment_id IS NOT NULL AND recruitment_id IN (
      SELECT id FROM public.recruitments WHERE organizer_id IN (
        SELECT id FROM public.organizers WHERE profile_id = auth.uid()
      )
    ))
  )
);

-- Realtime で chat_messages の INSERT を購読可能にする
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;
