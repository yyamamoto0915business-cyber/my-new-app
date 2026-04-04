-- create_or_get_conversation_for_user を PostgREST のスキーマキャッシュに認識させる
NOTIFY pgrst, 'reload schema';
