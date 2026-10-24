-- ミッションで参加者が送った写真を、非公開の保存場所に置く（主催者の管理画面から、期限つきのアドレスで見る）

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('mission-photos', 'mission-photos', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false;
