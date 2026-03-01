-- PostgREST のスキーマキャッシュをリロード（get_inbox 等の新関数を認識させる）
NOTIFY pgrst, 'reload schema';
