-- チャット強化: 文脈パネル・ステータス・system message 対応

-- 1) chat_rooms: 主催者メモ（ピン留め）
ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS organizer_memo TEXT;

-- 2) chat_messages: type = user | system
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'user' CHECK (type IN ('user', 'system'));

-- 3) event_participants: ステータス拡張（辞退・変更希望）
ALTER TABLE public.event_participants
  DROP CONSTRAINT IF EXISTS event_participants_status_check;
ALTER TABLE public.event_participants
  ADD CONSTRAINT event_participants_status_check
  CHECK (status IN ('applied', 'confirmed', 'declined', 'change_requested', 'checked_in', 'completed'));

-- 4) event_participants: 参加者が自分自身のステータスを更新可能
CREATE POLICY "event_participants_update_own_status" ON public.event_participants
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
