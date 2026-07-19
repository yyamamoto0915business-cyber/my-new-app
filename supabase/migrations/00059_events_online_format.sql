-- 開催形式（現地 / オンライン / ハイブリッド）とオンライン参加設定
-- リマインダー設定（参加パス → ベル通知）

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_format text NOT NULL DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS online_service text,
  ADD COLUMN IF NOT EXISTS online_join_url text,
  ADD COLUMN IF NOT EXISTS online_meeting_id text,
  ADD COLUMN IF NOT EXISTS online_passcode text,
  ADD COLUMN IF NOT EXISTS online_guide_message text,
  ADD COLUMN IF NOT EXISTS online_link_visibility text NOT NULL DEFAULT 'pass_holders_only',
  ADD COLUMN IF NOT EXISTS online_link_display_timing text NOT NULL DEFAULT '15_minutes_before',
  ADD COLUMN IF NOT EXISTS public_page_link_visible boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_event_format_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_event_format_check
      CHECK (event_format IN ('onsite', 'online', 'hybrid'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_online_service_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_online_service_check
      CHECK (
        online_service IS NULL
        OR online_service IN (
          'zoom',
          'google_meet',
          'microsoft_teams',
          'youtube_live',
          'other'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_online_link_visibility_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_online_link_visibility_check
      CHECK (online_link_visibility IN ('pass_holders_only'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_online_link_display_timing_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_online_link_display_timing_check
      CHECK (
        online_link_display_timing IN (
          'immediately',
          '60_minutes_before',
          '30_minutes_before',
          '15_minutes_before',
          '5_minutes_before'
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.events.event_format IS '開催形式: onsite / online / hybrid';
COMMENT ON COLUMN public.events.online_join_url IS 'オンライン参加URL（公開ページ・公開APIには含めない）';
COMMENT ON COLUMN public.events.public_page_link_visible IS '公開ページへのリンク表示（常に false 想定）';

-- 参加パスのリマインダー設定
CREATE TABLE IF NOT EXISTS public.event_reminder_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  remind_minutes_before integer NOT NULL DEFAULT 30,
  remind_at timestamptz NOT NULL,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS event_reminder_prefs_due_idx
  ON public.event_reminder_prefs (remind_at)
  WHERE enabled = true AND notified_at IS NULL;

ALTER TABLE public.event_reminder_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_reminder_prefs_select_own" ON public.event_reminder_prefs;
CREATE POLICY "event_reminder_prefs_select_own"
  ON public.event_reminder_prefs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "event_reminder_prefs_insert_own" ON public.event_reminder_prefs;
CREATE POLICY "event_reminder_prefs_insert_own"
  ON public.event_reminder_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "event_reminder_prefs_update_own" ON public.event_reminder_prefs;
CREATE POLICY "event_reminder_prefs_update_own"
  ON public.event_reminder_prefs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "event_reminder_prefs_delete_own" ON public.event_reminder_prefs;
CREATE POLICY "event_reminder_prefs_delete_own"
  ON public.event_reminder_prefs FOR DELETE
  USING (auth.uid() = user_id);
