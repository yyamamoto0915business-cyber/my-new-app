-- get_unread_total(): 認証ユーザーの未読メッセージ合計を返す
CREATE OR REPLACE FUNCTION public.get_unread_total()
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::BIGINT
    FROM public.conversation_members mc
    JOIN public.messages m ON m.conversation_id = mc.conversation_id
    WHERE mc.user_id = auth.uid()
      AND m.sender_id != auth.uid()
      AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_unread_total() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_unread_total() TO authenticated;

-- get_unread_breakdown(): 主催者向け 未読内訳（kind別）
-- event_inquiry → 参加者, general → ボランティア
CREATE OR REPLACE FUNCTION public.get_unread_breakdown()
RETURNS TABLE (volunteer_count BIGINT, participant_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH unread_per_conv AS (
    SELECT c.kind, COUNT(*)::BIGINT AS cnt
    FROM public.conversation_members mc
    JOIN public.messages m ON m.conversation_id = mc.conversation_id
    JOIN public.conversations c ON c.id = mc.conversation_id
    WHERE mc.user_id = auth.uid()
      AND m.sender_id != auth.uid()
      AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
    GROUP BY c.id, c.kind
  )
  SELECT
    COALESCE(SUM(CASE WHEN kind = 'general' THEN cnt ELSE 0 END), 0)::BIGINT AS volunteer_count,
    COALESCE(SUM(CASE WHEN kind = 'event_inquiry' THEN cnt ELSE 0 END), 0)::BIGINT AS participant_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_unread_breakdown() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_unread_breakdown() TO authenticated;
