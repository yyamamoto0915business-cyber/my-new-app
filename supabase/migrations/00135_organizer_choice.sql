-- TEAM：いくつかのチーム（主催者）に入っている人が、いまどのチームとして使うか（1人1行）。
-- 画面とサーバーの両方から同じ選択を読むため、データベースに置く（どの端末でも同じチームになる）。
-- 読めるのは本人の行だけ。書きこみは API が「そのチームに入っているか」を確かめてから、管理用の接続で行う。
-- 選んだチームから外れた・TEAM が切れたときは、アプリが今までどおりの順で別のチームを使う（この行は残っていてよい）。

CREATE TABLE IF NOT EXISTS public.organizer_choices (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizer_choices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizer_choices_select_own ON public.organizer_choices;
CREATE POLICY organizer_choices_select_own ON public.organizer_choices
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

REVOKE ALL ON public.organizer_choices FROM anon;
GRANT SELECT ON public.organizer_choices TO authenticated;
GRANT ALL ON public.organizer_choices TO service_role;

NOTIFY pgrst, 'reload schema';
