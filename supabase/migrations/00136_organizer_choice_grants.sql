-- 00135 の organizer_choices：ログインした人は「読む」だけ（書くのは API が管理用の接続で）。
-- 初期設定で付いていた書く・消す権限を外す（RLS に書くルールがないので今も書けないが、念のため）。
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.organizer_choices FROM authenticated;
REVOKE ALL ON public.organizer_choices FROM anon;
