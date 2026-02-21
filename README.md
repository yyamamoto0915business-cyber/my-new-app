# 地域イベントプラットフォーム

地域のイベント情報を一元化し、参加者が簡単に探して参加できるプラットフォームです。

## 機能

- **イベント告知**: 一覧・詳細・検索（今日/今週、無料/有料、子連れOK、距離順）
- **参加申込**: イベントへの参加申込・キャンセル
- **募集機能**: ボランティア、有償スポット、求人、技術ボランティアの4種
- **認証**: サインアップ・ログイン（Supabase Auth）
- **主催者登録**: 主催者として団体登録
- **ポイント**: マイポイント表示（Supabase 連携時）
- **証明書**: 活動証明書 PDF 生成（jspdf）

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. Supabase プロジェクト

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. `.env.example` を `.env.local` にコピー
3. Supabase ダッシュボードの Settings > API から URL と anon key を取得し、`.env.local` に設定

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. マイグレーション実行

Supabase ダッシュボードの SQL Editor で、`supabase/migrations/` 内の SQL を順に実行してください。

1. `00001_initial_schema.sql`
2. `00002_recruitments.sql`
3. `00003_chat.sql`
4. `00004_points_plans.sql`

### 4. 開発サーバー起動

```bash
npm run dev
```

Supabase が未設定の場合、モックデータで動作します。

### 5. ローカル以外からのアクセス

**同じ Wi‑Fi 内のスマホ・他 PC からアクセスする場合**

```bash
npm run dev:network
```

起動後、PC の IP アドレスを確認して `http://192.168.x.x:3000` でアクセスしてください。
（macOS: システム設定 > ネットワーク で確認）

**インターネットからアクセスする場合（デプロイ）**

[Vercel](https://vercel.com) にデプロイするのがおすすめです（無料プランあり）。

### 初回セットアップ（一度だけ）

1. [Vercel](https://vercel.com) にログイン（GitHub アカウントでログイン推奨）
2. **Add New** → **Project** をクリック
3. **Import Git Repository** から対象の GitHub リポジトリを選択
4. **Import** をクリック
5. 環境変数を設定（下記参照）して **Deploy** をクリック

### 自動デプロイ（設定後）

リポジトリを接続すると、**`main` ブランチへの `git push` のたびに自動で本番デプロイ**が実行されます。

```bash
git add .
git commit -m "更新内容"
git push origin main
```

Vercel が自動的にビルド・デプロイし、数分で反映されます。手動での再デプロイは不要です。

### Vercel の環境変数

Vercel ダッシュボード: **Project** → **Settings** → **Environment Variables**

| 変数名 | 説明 | 本番の例 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | （ダッシュボードから取得） |
| `AUTH_SECRET` | NextAuth の秘密鍵 | 本番ではランダムな文字列 |
| `AUTH_DISABLED` | 開発中: `true` で認証オフ | 本番では `false` または未設定 |
| `NEXT_PUBLIC_AUTH_DISABLED` | 同上（クライアント用） | 本番では `false` または未設定 |

## 今後の拡張（Phase 5）

- **PayPay API**: ポイント交換（事業者審査が必要）
- **リマインド通知**: 前日・当日のメール/プッシュ
- **変更通知**: 中止・時間変更時の自動送信
- **Realtime チャット**: Supabase Realtime による個別チャット

## 技術スタック

- Next.js 16 (App Router)
- Supabase (Auth, PostgreSQL, Realtime)
- Tailwind CSS
- TypeScript
