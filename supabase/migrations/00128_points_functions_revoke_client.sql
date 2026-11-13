-- ポイントを渡す・使う・戻す・数える関数を、アプリのサーバー（service_role）だけが呼べるようにする。
-- Supabase は public の関数を anon・authenticated にも最初から使えるようにするため、
-- これまでの「REVOKE ... FROM PUBLIC」だけでは閉じていなかった（ログインなしの鍵で呼べた）。
-- アプリはどれも createAdminClient()（service_role）から呼ぶので、動きは変わらない。

REVOKE EXECUTE ON FUNCTION public.award_stamp_rally_points(uuid, uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_play_points(uuid, uuid, integer, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.event_points_balance(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_event_points(uuid, uuid, integer, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_event_points(uuid, uuid, text) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.award_stamp_rally_points(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.award_play_points(uuid, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.event_points_balance(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_event_points(uuid, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_event_points(uuid, uuid, text) TO service_role;
