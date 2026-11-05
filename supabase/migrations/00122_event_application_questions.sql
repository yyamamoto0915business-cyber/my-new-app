-- MachiGlyph: イベントの申し込みで、主催者が自由に質問を足せるようにする
-- events.application_questions: 質問の一覧（[{ id, label, type: "text" | "select", required, options? }]・5つまで）
-- event_participants.answers: 申し込んだ人の答え（{ 質問の id: 答え }）

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS application_questions JSONB;

ALTER TABLE public.event_participants
  ADD COLUMN IF NOT EXISTS answers JSONB;

NOTIFY pgrst, 'reload schema';
