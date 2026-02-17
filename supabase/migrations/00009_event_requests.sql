-- event_requests: イベント提案
CREATE TABLE IF NOT EXISTS public.event_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prefecture TEXT,
  city TEXT,
  target_amount INTEGER NOT NULL DEFAULT 0,
  current_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'funded', 'planned', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- event_request_supports: 支援
CREATE TABLE IF NOT EXISTS public.event_request_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.event_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_request_supports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_requests_select_all" ON public.event_requests FOR SELECT USING (true);
CREATE POLICY "event_requests_insert_own" ON public.event_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_requests_update_own" ON public.event_requests FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "event_request_supports_select_all" ON public.event_request_supports FOR SELECT USING (true);
CREATE POLICY "event_request_supports_insert_own" ON public.event_request_supports FOR INSERT WITH CHECK (auth.uid() = user_id);
