-- participation_mode: 申込必須 / 申込任意 / 申込不要
-- requires_registration=true の既存イベントは required に、false は none にマッピング
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS participation_mode TEXT
  DEFAULT 'none'
  CHECK (participation_mode IN ('required', 'optional', 'none'));

-- 既存データの移行: requires_registration がある場合のみ
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'requires_registration'
  ) THEN
    UPDATE public.events SET participation_mode = 'required' WHERE requires_registration = true;
  END IF;
END $$;

-- event_reactions: 参加予定・気になる（軽い反応。event_participants は正式申込用）
CREATE TABLE IF NOT EXISTS public.event_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('planned', 'interested')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_event_reactions_event ON public.event_reactions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_profile ON public.event_reactions(profile_id);

ALTER TABLE public.event_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_reactions_select" ON public.event_reactions FOR SELECT USING (
  true
);
CREATE POLICY "event_reactions_insert_own" ON public.event_reactions FOR INSERT
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY "event_reactions_delete_own" ON public.event_reactions FOR DELETE
  USING (profile_id = auth.uid());
