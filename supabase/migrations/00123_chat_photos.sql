-- チャットで写真を送れるようにする
-- 写真は非公開の chat-media に置き、サーバーが会話の参加者かどうかを確かめてから、
-- 期限つきの URL を出して見せる（誰でも見られる post-media には置かない）

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- storage.objects のポリシーは足さない（読み書きはサーバーの service role だけ）

NOTIFY pgrst, 'reload schema';
