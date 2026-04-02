-- 会話作成: サーバー（service_role）のみが呼べる RPC。
-- クライアントの JWT が PostgREST に正しく伝わらない本番環境でも、API が検証した caller を渡して作成できる。
-- 公開 RPC create_or_get_conversation(auth.uid 依存)は据え置き。

CREATE OR REPLACE FUNCTION public.create_or_get_conversation_for_user(
  p_caller UUID,
  p_event_id UUID,
  p_kind TEXT,
  p_organizer_id UUID,
  p_other_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conv_id UUID;
  v_organizer_profile_id UUID;
BEGIN
  SELECT profile_id INTO v_organizer_profile_id FROM public.organizers WHERE id = p_organizer_id;
  IF v_organizer_profile_id IS NULL THEN
    RAISE EXCEPTION 'organizer not found';
  END IF;
  IF p_caller IS DISTINCT FROM v_organizer_profile_id AND p_caller IS DISTINCT FROM p_other_user_id THEN
    RAISE EXCEPTION 'not allowed to create this conversation';
  END IF;

  INSERT INTO public.conversations (event_id, kind, organizer_id, other_user_id)
  VALUES (
    NULLIF(p_event_id, '00000000-0000-0000-0000-000000000000'::uuid),
    p_kind,
    p_organizer_id,
    p_other_user_id
  )
  ON CONFLICT ((COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid)), kind, organizer_id, other_user_id)
  DO NOTHING;

  SELECT id INTO v_conv_id FROM public.conversations
  WHERE COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(NULLIF(p_event_id, '00000000-0000-0000-0000-000000000000'::uuid), '00000000-0000-0000-0000-000000000000'::uuid)
    AND kind = p_kind AND organizer_id = p_organizer_id AND other_user_id = p_other_user_id;

  IF v_conv_id IS NULL THEN
    RAISE EXCEPTION 'conversation upsert did not resolve id';
  END IF;

  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (v_conv_id, v_organizer_profile_id), (v_conv_id, p_other_user_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
SET row_security = off;

REVOKE ALL ON FUNCTION public.create_or_get_conversation_for_user(UUID, UUID, TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation_for_user(UUID, UUID, TEXT, UUID, UUID) TO service_role;
