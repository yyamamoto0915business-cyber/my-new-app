# MachiGlyph 運営スタッフ（ボランティア）募集 MVP

「募集 → 応募 → 連絡 → 当日チェックイン管理」の最小運用セットです。

## 1. 変更したファイル一覧

### 新規作成
- `supabase/migrations/00018_volunteer_recruitment_mvp.sql` - DB スキーマ拡張
- `lib/db/recruitments-mvp.ts` - 募集・応募の DB 操作
- `lib/api-auth.ts` - API 用認証取得
- `lib/created-recruitments-store.ts` - Supabase 未設定時のフォールバック
- `app/api/auth/me/route.ts` - 現在ユーザー取得
- `app/api/recruitments/route.ts` - 募集一覧・作成（既存を拡張）
- `app/api/recruitments/[id]/route.ts` - 募集取得・更新（既存を拡張）
- `app/api/recruitments/[id]/apply/route.ts` - 応募＋自動返信
- `app/api/recruitments/[id]/applications/route.ts` - 応募者一覧
- `app/api/recruitments/[id]/applications/[appId]/route.ts` - 応募ステータス更新
- `app/api/recruitments/[id]/chat-room/route.ts` - チャットルーム取得
- `app/api/recruitments/[id]/my-status/route.ts` - 自分の応募ステータス
- `app/api/recruitments/[id]/bulk-message/route.ts` - 一斉連絡
- `components/recruitment-form.tsx` - 募集作成・編集フォーム
- `components/MapRecruitmentPins.tsx` - おすすめ3ピン＋足あと道
- `app/organizer/recruitments/page.tsx` - 主催者募集一覧（既存を置換）
- `app/organizer/recruitments/new/page.tsx` - 募集新規作成（既存を置換）
- `app/organizer/recruitments/[id]/page.tsx` - 募集詳細・応募者管理・チャット
- `app/organizer/recruitments/[id]/day-of/page.tsx` - 当日モード
- `app/recruitments/[id]/page.tsx` - 募集詳細（サーバー）
- `app/recruitments/[id]/recruitment-detail-client.tsx` - 募集詳細・応募・チャット
- `scripts/seed-recruitments.ts` - シード用スクリプト

### 変更
- `lib/db/chat.ts` - recruitment 1:1 ルーム取得・作成を追加
- `components/home-otonami.tsx` - おすすめピン＋募集一覧を統合
- `app/organizer/events/page.tsx` - 募集管理リンクを追加
- `app/api/recruitments/route.ts` - Supabase/ストア対応、mine 対応

## 2. 追加した DB / テーブル

### 拡張（00018 マイグレーション）

**recruitments**
- `start_at`, `end_at` - 開始/終了日時
- `meeting_place`, `meeting_lat`, `meeting_lng` - 集合場所
- `roles` (JSONB) - 役割と人数
- `capacity` - 定員
- `items_to_bring`, `provisions`, `notes` - 持ち物・支給・注意事項
- `status` - draft / public / closed

**recruitment_applications**
- `checked_in_at` - チェックイン日時
- `role_assigned` - 割当役割
- status に pending / accepted / rejected / canceled を追加

**chat_rooms**
- recruitment × participant の 1:1 ルーム作成ポリシーを追加

**トリガー**
- 定員到達時に status を closed に自動更新

## 3. ローカルでの動作確認手順

### Supabase 未設定（開発用ストア）

1. `npm run dev` で起動
2. **HOME**
   - http://localhost:3000 を開く
   - おすすめ3ピン＋募集一覧が表示される（シード3件）
3. **募集詳細**
   - ピンまたはカードをクリック → 募集詳細へ
4. **応募**
   - `AUTH_DISABLED=true` の場合はログイン不要
   - 「1タップで応募」→ 応募済み表示
   - チャットは Supabase 接続時のみ
5. **主催者**
   - 主催 → 募集管理
   - 新規作成で募集を作成
   - 募集詳細で応募者を採用 → 当日モードへ
   - 当日モードでチェックイン・役割割当・一斉連絡

### Supabase 接続時

1. `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
2. `npm run supabase:push` でマイグレーション実行
3. 主催者登録: `/organizer/register` で登録
4. 募集作成 → 公開 → 応募 → チャット（自動返信）→ 採用 → 当日モード

## 4. シード（ダミー募集）

**インメモリ（Supabase 未設定）**  
`lib/created-recruitments-store.ts` にダミー3件を初期データとして含めています。

**API 経由（主催者ログイン後）**
```bash
# スクリプトで curl 例を表示
npx tsx scripts/seed-recruitments.ts
```

## 5. 受け入れ条件の確認

| 条件 | 状態 |
|------|------|
| 主催者が募集を公開 → HOME に出る | ✅ |
| 参加者が応募 → 自動返信が入る → 主催者がチャット返信できる | ✅（Supabase 時） |
| 主催者が応募者を採用 → 当日モードに採用者が出る | ✅ |
| 当日モードでチェックインでき、到着/未到着でフィルタできる | ✅ |
| 主催者が採用者に一斉連絡できる | ✅ |

## 6. 定型文ボタン（一斉連絡）

主催者ダッシュボード・当日モードで利用可能:

- **前日リマインド** - reminder
- **集合場所変更** - venue_change
- **お礼メッセージ** - thanks
- **カスタム** - 自由文
