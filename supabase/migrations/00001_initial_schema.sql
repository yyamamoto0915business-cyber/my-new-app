-- profiles: ユーザープロフィール（auth.users と 1:1）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- organizers: 主催者（profiles と 1:1、主催者として登録した場合）
CREATE TABLE IF NOT EXISTS public.organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'light', 'standard')),
  organization_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- events: イベント
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  price_note TEXT,
  rain_policy TEXT,
  items_to_bring TEXT[],
  access TEXT,
  child_friendly BOOLEAN DEFAULT false,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- event_participants: イベント参加者
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'confirmed', 'checked_in', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- RLS 有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のみ読み書き
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- organizers: 自分のみ
CREATE POLICY "organizers_select_own" ON public.organizers FOR SELECT USING (
  profile_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "organizers_insert_own" ON public.organizers FOR INSERT WITH CHECK (
  profile_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "organizers_update_own" ON public.organizers FOR UPDATE USING (
  profile_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
);

-- events: 全員が読める、主催者のみ編集
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert_organizer" ON public.events FOR INSERT WITH CHECK (
  organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
);
CREATE POLICY "events_update_organizer" ON public.events FOR UPDATE USING (
  organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
);
CREATE POLICY "events_delete_organizer" ON public.events FOR DELETE USING (
  organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
);

-- event_participants: 参加者と主催者がアクセス可能
CREATE POLICY "event_participants_select" ON public.event_participants FOR SELECT USING (
  user_id = auth.uid() OR
  event_id IN (SELECT id FROM public.events WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid()))
);
CREATE POLICY "event_participants_insert_own" ON public.event_participants FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "event_participants_update_organizer" ON public.event_participants FOR UPDATE USING (
  event_id IN (SELECT id FROM public.events WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid()))
);

-- auth.users 作成時に profiles を自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
