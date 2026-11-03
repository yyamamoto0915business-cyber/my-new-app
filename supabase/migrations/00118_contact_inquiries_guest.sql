-- MachiGlyph: ログインしていない人もお問い合わせを送れるようにする（App Store のサポート URL 用）
-- ゲストの送信は API がサービスロールで入れるので、RLS のポリシーは変えない

ALTER TABLE public.contact_inquiries
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

ALTER TABLE public.contact_inquiries
  DROP CONSTRAINT IF EXISTS contact_inquiries_sender_present;
ALTER TABLE public.contact_inquiries
  ADD CONSTRAINT contact_inquiries_sender_present
  CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);

ALTER TABLE public.contact_inquiries
  DROP CONSTRAINT IF EXISTS contact_inquiries_guest_len;
ALTER TABLE public.contact_inquiries
  ADD CONSTRAINT contact_inquiries_guest_len
  CHECK (
    (guest_name IS NULL OR char_length(guest_name) <= 100)
    AND (guest_email IS NULL OR char_length(guest_email) <= 254)
  );
