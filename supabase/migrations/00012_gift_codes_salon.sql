-- event_gift_codes: ギフトコード
CREATE TABLE IF NOT EXISTS public.event_gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_gift_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_gift_codes_select_own_or_public" ON public.event_gift_codes FOR SELECT USING (
  auth.uid() = sender_user_id OR auth.uid() = used_by OR used_at IS NULL
);
CREATE POLICY "event_gift_codes_insert_own" ON public.event_gift_codes FOR INSERT WITH CHECK (auth.uid() = sender_user_id);
CREATE POLICY "event_gift_codes_update_own" ON public.event_gift_codes FOR UPDATE USING (auth.uid() = sender_user_id OR auth.uid() = used_by);

-- salon_members: サロン会員
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salon_member_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.salon_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.salon_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_members_select_own" ON public.salon_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "salon_members_insert_own" ON public.salon_members FOR INSERT WITH CHECK (auth.uid() = user_id);
