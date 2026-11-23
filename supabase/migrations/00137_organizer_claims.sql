-- 運営が代わりに作った主催者ページを、相手に「受け取って」もらうためのもの。
-- 1つの主催者ページに1行。受け取りリンク（token）は1回だけ・期限つき。
-- 読み書きは管理用の接続（service_role）だけ。

CREATE TABLE IF NOT EXISTS public.organizer_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL UNIQUE REFERENCES public.organizers(id) ON DELETE CASCADE,
  -- 受け取るまでの仮の持ち主（ログインには使わない）
  placeholder_profile_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_note TEXT,
  token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizer_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organizer_claims FROM anon, authenticated;
GRANT ALL ON public.organizer_claims TO service_role;

NOTIFY pgrst, 'reload schema';
