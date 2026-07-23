-- イベント単位の主催者名・連絡先（フォーム入力を永続化）
-- 未設定（NULL）のときは organizers 側の値をフォールバック表示する
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS organizer_display_name TEXT,
  ADD COLUMN IF NOT EXISTS organizer_contact TEXT;
