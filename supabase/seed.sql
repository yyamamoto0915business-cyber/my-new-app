-- ローカル開発用シード（supabase db reset 時に自動適用 / scripts/local-supabase.sh からも利用）。
-- 公開イベントを数件投入し、実 DB でもホーム・「探す」に地域イベントが表示されるようにする。
-- 冪等: 固定 UUID + ON CONFLICT DO NOTHING。本番では使用しないこと。

-- 主催者アカウント（auth.users への INSERT で on_auth_user_created トリガーが profiles を自動作成）
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'seed-organizer@example.com',
  crypt('Passw0rd!123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"まちの縁側プロジェクト","role":"ORGANIZER"}',
  now(), now()
) on conflict (id) do nothing;

-- 主催者レコード
insert into public.organizers (id, profile_id, plan)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'free'
) on conflict (id) do nothing;

-- 公開イベント
insert into public.events (
  id, organizer_id, title, description, short_description,
  date, start_time, end_time, location, address, prefecture, city,
  price, child_friendly, image_url, tags,
  organizer_display_name, status, is_public, published_at
) values
(
  '33333333-3333-3333-3333-333333333001',
  '22222222-2222-2222-2222-222222222222',
  '朝のコーヒー焙煎ワークショップ',
  '自家焙煎の基礎を、地元のロースターと一緒に体験します。初めての方も歓迎です。挽きたての一杯を味わいながら、まちの人とゆるやかに交流しましょう。',
  '地元ロースターと学ぶ、はじめての焙煎体験',
  '2026-09-20', '10:00', '12:00', 'まちの縁側カフェ', '東京都調布市布田1-1-1', '東京都', '調布市',
  1500, true, 'https://picsum.photos/seed/machiglyph-coffee/800/600', array['カフェ','ワークショップ','初心者歓迎'],
  'まちの縁側プロジェクト', 'published', true, now()
),
(
  '33333333-3333-3333-3333-333333333002',
  '22222222-2222-2222-2222-222222222222',
  '週末キッチンカーマルシェ',
  '地域のキッチンカーが集まる週末マルシェ。クレープ、コーヒー、地元野菜のデリなど。お子さま向けの縁日コーナーもあります。',
  '地元キッチンカーが集う、家族で楽しむ週末マルシェ',
  '2026-09-27', '11:00', '16:00', '中央公園 芝生広場', '東京都調布市小島町2-2-2', '東京都', '調布市',
  0, true, 'https://picsum.photos/seed/machiglyph-kitchencar/800/600', array['キッチンカー','マルシェ','子連れOK'],
  'まちの縁側プロジェクト', 'published', true, now()
),
(
  '33333333-3333-3333-3333-333333333003',
  '22222222-2222-2222-2222-222222222222',
  '河川敷クリーン活動ボランティア',
  'みんなで河川敷をきれいにする清掃ボランティアです。軍手・ゴミ袋はこちらで用意します。活動後はドリンクを配布。はじめての方も気軽にどうぞ。',
  'みんなで河川敷をきれいに。はじめてOKの清掃ボランティア',
  '2026-10-04', '09:00', '11:00', '多摩川 河川敷', '東京都調布市多摩川3-3-3', '東京都', '調布市',
  0, true, 'https://picsum.photos/seed/machiglyph-volunteer/800/600', array['ボランティア','環境','地域貢献'],
  'まちの縁側プロジェクト', 'published', true, now()
),
(
  '33333333-3333-3333-3333-333333333004',
  '22222222-2222-2222-2222-222222222222',
  'やさしい英会話サロン',
  '生活で使えるやさしい英語を、少人数でゆっくり練習します。海外からの参加者との交流タイムもあり。ドリンク付き。',
  '少人数でゆっくり、生活で使えるやさしい英会話',
  '2026-10-11', '14:00', '15:30', 'コミュニティルームA', '東京都調布市国領町4-4-4', '東京都', '調布市',
  800, false, 'https://picsum.photos/seed/machiglyph-english/800/600', array['英語','講座','交流'],
  'まちの縁側プロジェクト', 'published', true, now()
)
on conflict (id) do nothing;
