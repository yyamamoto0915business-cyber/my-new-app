-- MachiGlyph: お問い合わせ（管理者画面で確認）
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_inquiries_subject_len CHECK (char_length(subject) <= 200),
  CONSTRAINT contact_inquiries_body_len CHECK (char_length(body) <= 1000)
);

CREATE INDEX IF NOT EXISTS contact_inquiries_created_at_idx
  ON public.contact_inquiries (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_inquiries_status_idx
  ON public.contact_inquiries (status);

CREATE INDEX IF NOT EXISTS contact_inquiries_user_id_idx
  ON public.contact_inquiries (user_id);

CREATE OR REPLACE FUNCTION public.set_contact_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contact_inquiries_set_updated_at ON public.contact_inquiries;
CREATE TRIGGER contact_inquiries_set_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contact_inquiries_updated_at();

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_inquiries_select_own"
  ON public.contact_inquiries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contact_inquiries_insert_own"
  ON public.contact_inquiries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contact_inquiries_select_admin"
  ON public.contact_inquiries
  FOR SELECT
  USING (public.is_developer_admin(auth.uid()));

CREATE POLICY "contact_inquiries_update_admin"
  ON public.contact_inquiries
  FOR UPDATE
  USING (public.is_developer_admin(auth.uid()))
  WITH CHECK (public.is_developer_admin(auth.uid()));
