-- recruitments: 募集（ボランティア/有償スポット/求人/技術ボランティア）
CREATE TABLE IF NOT EXISTS public.recruitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('volunteer', 'paid_spot', 'job', 'tech_volunteer')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  -- volunteer
  role TEXT,
  time_slot TEXT,
  compensation_type TEXT,
  compensation_note TEXT,
  -- paid_spot / job
  pay_type TEXT,
  pay_amount INTEGER,
  work_hours TEXT,
  work_content TEXT,
  payment_method TEXT,
  employer_name TEXT,
  -- job
  employment_type TEXT,
  work_conditions TEXT,
  application_method TEXT,
  -- tech_volunteer
  tech_slot TEXT CHECK (tech_slot IN ('consultation', 'light', 'project')),
  deliverable_scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- recruitment_applications: 応募
CREATE TABLE IF NOT EXISTS public.recruitment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'confirmed', 'checked_in', 'completed')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recruitment_id, user_id)
);

ALTER TABLE public.recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recruitments_select_all" ON public.recruitments FOR SELECT USING (true);
CREATE POLICY "recruitments_insert_organizer" ON public.recruitments FOR INSERT WITH CHECK (
  organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
);
CREATE POLICY "recruitments_update_organizer" ON public.recruitments FOR UPDATE USING (
  organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
);
CREATE POLICY "recruitments_delete_organizer" ON public.recruitments FOR DELETE USING (
  organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
);

CREATE POLICY "recruitment_applications_select" ON public.recruitment_applications FOR SELECT USING (
  user_id = auth.uid() OR
  recruitment_id IN (
    SELECT id FROM public.recruitments
    WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
  )
);
CREATE POLICY "recruitment_applications_insert_own" ON public.recruitment_applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "recruitment_applications_update" ON public.recruitment_applications FOR UPDATE USING (
  user_id = auth.uid() OR
  recruitment_id IN (
    SELECT id FROM public.recruitments
    WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
  )
);
