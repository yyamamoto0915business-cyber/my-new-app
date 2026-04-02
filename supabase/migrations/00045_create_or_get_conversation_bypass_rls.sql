-- create_or_get_conversation: RPC 内の SELECT conversations が RLS で 0 行になり、
-- v_conv_id が NULL のまま conversation_members へ INSERT して失敗するケースを防ぐ。
-- 関数属性 SET row_security = off で参照のみ RLS を無効化（auth.uid() チェックは関数内で維持）。
-- 参照: https://www.postgresql.org/docs/current/sql-createfunction.html (SET configuration_parameter)

CREATE OR REPLACE FUNCTION public.create_or_get_conversation(
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
  IF auth.uid() != v_organizer_profile_id AND auth.uid() != p_other_user_id THEN
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

REVOKE EXECUTE ON FUNCTION public.create_or_get_conversation(UUID, TEXT, UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation(UUID, TEXT, UUID, UUID) TO authenticated;
