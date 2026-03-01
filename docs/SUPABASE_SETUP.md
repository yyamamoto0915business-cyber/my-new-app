# Supabase 導入ガイド

このプロジェクトで Supabase を使い始めるための手順です。

**初めての方は [SUPABASE_QUICKSTART.md](./SUPABASE_QUICKSTART.md) がおすすめです（5分で完了）。**

## 1. Supabase プロジェクトを作成

1. [supabase.com](https://supabase.com) にアクセスして **Sign in**（GitHub でログイン可能）
2. **New Project** をクリック
4. 以下を設定して **Create new project**:
   - **Name**: 任意（例: `my-new-app`）
   - **Database Password**: 忘れずメモ（後で `supabase link` に必要）
   - **Region**: 日本なら `Northeast Asia (Tokyo)` が近い

## 2. 環境変数を設定

### 2-1. .env.local を作成

```bash
cp .env.example .env.local
```

### 2-2. Supabase の URL とキーを取得

1. Supabase ダッシュボードでプロジェクトを開く
2. 左メニュー **Project Settings** → **API**
3. 以下をコピー:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**（Project API keys 内）→ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2-3. .env.local を編集

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

`xxxx` と `eyJ...` の部分を実際の値に置き換えてください。

## 3. データベースのマイグレーション

テーブルやポリシーを作成するために、マイグレーションを実行します。

### 方法 A: Supabase CLI（推奨）

```bash
# 1. プロジェクトをリンク（.env.local の URL から自動取得）
./scripts/supabase-link.sh

# 2. マイグレーションを適用
npx supabase db push
```

`supabase link` でデータベースパスワードを聞かれたら、プロジェクト作成時のパスワードを入力します。

### 方法 B: SQL Editor で手動実行

Supabase ダッシュボードの **SQL Editor** で、以下のファイルを**番号順に**実行してください。

- `supabase/migrations/00001_initial_schema.sql`
- `supabase/migrations/00002_recruitments.sql`
- ... 00015 まで順番に

## 4. 動作確認

```bash
npm run dev
```

1. ブラウザで http://localhost:3000 を開く
2. ログインまたはサインアップ
3. マイページ（/profile）でプロフィールを保存できることを確認

## トラブルシューティング

### 「Supabase が設定されていません」と表示される

- `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しく設定されているか確認
- 開発サーバーを再起動（`npm run dev`）

### `supabase link` で「project ref」エラー

- `.env.local` が存在し、`NEXT_PUBLIC_SUPABASE_URL` が設定されているか確認
- URL 形式: `https://<project-ref>.supabase.co`

### マイグレーションが失敗する

- 新規プロジェクトの場合、00001 から順に実行されているか確認
- 既存プロジェクトの場合、不足しているマイグレーションだけ実行
