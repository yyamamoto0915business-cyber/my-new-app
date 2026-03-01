-- MachiGlyph MVP: 運営スタッフ（ボランティア）募集 → 連絡 → 当日管理
-- 募集テーブル拡張 + 応募拡張 + チャット recruitment 1:1

-- ============================================
-- 1. recruitments 拡張（MVP用カラム追加）
-- ============================================
ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meeting_place TEXT,
  ADD COLUMN IF NOT EXISTS meeting_lat DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS meeting_lng DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS items_to_bring TEXT,
  ADD COLUMN IF NOT EXISTS provisions TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'public', 'closed'));

-- 既存レコードの status を public に（後方互換）
UPDATE public.recruitments SET status = 'public' WHERE status IS NULL;

-- ============================================
-- 2. recruitment_applications 拡張
-- ============================================
ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS role_assigned TEXT;

-- status の制約を拡張: pending/accepted/rejected/canceled を追加
ALTER TABLE public.recruitment_applications
  DROP CONSTRAINT IF EXISTS recruitment_applications_status_check;
ALTER TABLE public.recruitment_applications
  ADD CONSTRAINT recruitment_applications_status_check
  CHECK (status IN ('applied', 'confirmed', 'checked_in', 'completed', 'pending', 'accepted', 'rejected', 'canceled'));

-- 既存 applied → pending に揃える（新規は pending 使用）
-- UPDATE は任意（既存データがあれば）

-- ============================================
-- 3. chat_rooms: recruitment 1:1 用ポリシー追加
-- ============================================
-- recruitment × participant のユニーク制約
CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_recruitment_participant_key
  ON public.chat_rooms (recruitment_id, participant_id)
  WHERE recruitment_id IS NOT NULL AND participant_id IS NOT NULL;

-- 募集用ルーム作成ポリシーを追加（既存の event 用と別）
DROP POLICY IF EXISTS "chat_rooms_insert_participant" ON public.chat_rooms;
-- event 用
CREATE POLICY "chat_rooms_insert_event" ON public.chat_rooms FOR INSERT WITH CHECK (
  event_id IS NOT NULL
  AND participant_id IS NOT NULL
  AND (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id IN (
        SELECT id FROM public.organizers WHERE profile_id = auth.uid()
      )
    )
    OR (
      participant_id = auth.uid()
      AND (event_id, auth.uid()) IN (
        SELECT event_id, user_id FROM public.event_participants
      )
    )
  )
);
-- recruitment 用: 主催者 or 応募者が作成可能
CREATE POLICY "chat_rooms_insert_recruitment" ON public.chat_rooms FOR INSERT WITH CHECK (
  recruitment_id IS NOT NULL
  AND participant_id IS NOT NULL
  AND type = 'recruitment'
  AND (
    -- 主催者
    recruitment_id IN (
      SELECT id FROM public.recruitments
      WHERE organizer_id IN (SELECT id FROM public.organizers WHERE profile_id = auth.uid())
    )
    OR
    -- 応募者本人
    (participant_id = auth.uid() AND recruitment_id IN (
      SELECT recruitment_id FROM public.recruitment_applications WHERE user_id = auth.uid()
    ))
  )
);

-- ============================================
-- 4. 定員到達時に status を closed に更新するトリガー
-- ============================================
CREATE OR REPLACE FUNCTION public.check_recruitment_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' OR NEW.status = 'confirmed' THEN
    UPDATE public.recruitments r
    SET status = 'closed', updated_at = NOW()
    WHERE r.id = NEW.recruitment_id
      AND r.status = 'public'
      AND r.capacity IS NOT NULL
      AND (
        SELECT COUNT(*) FROM public.recruitment_applications ra
        WHERE ra.recruitment_id = r.id
          AND ra.status IN ('accepted', 'confirmed')
      ) >= r.capacity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_accepted_capacity ON public.recruitment_applications;
CREATE TRIGGER on_application_accepted_capacity
  AFTER INSERT OR UPDATE OF status ON public.recruitment_applications
  FOR EACH ROW EXECUTE FUNCTION public.check_recruitment_capacity();
