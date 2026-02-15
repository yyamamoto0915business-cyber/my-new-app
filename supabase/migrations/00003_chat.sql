-- chat_rooms: チャットルーム（イベント or 募集に紐付け）
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  recruitment_id UUID REFERENCES public.recruitments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event', 'recruitment')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- chat_messages: メッセージ
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_rooms_select" ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY "chat_rooms_insert" ON public.chat_rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
