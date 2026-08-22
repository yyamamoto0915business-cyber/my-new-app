-- フォロー相手との 1対1 チャット（主催者レコード不要）
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_kind_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_kind_check
  CHECK (kind IN ('event_inquiry', 'general', 'follow_dm'));

ALTER TABLE public.conversations
  ALTER COLUMN organizer_id DROP NOT NULL;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS peer_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_follow_dm_unique
  ON public.conversations (
    LEAST(peer_user_id, other_user_id),
    GREATEST(peer_user_id, other_user_id)
  )
  WHERE kind = 'follow_dm';
