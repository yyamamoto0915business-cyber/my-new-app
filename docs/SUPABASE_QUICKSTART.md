# Supabase クイックスタート（5分）

## ステップ1: プロジェクト作成（ブラウザで実施）

1. 開いた Supabase ダッシュボードで **New Project** をクリック
2. 入力内容:
   - **Name**: `my-new-app` など任意
   - **Database Password**: 12文字以上（**必ずメモ**。後で `supabase link` で使用）
   - **Region**: `Northeast Asia (Tokyo)` を推奨
3. **Create new project** をクリック（1〜2分かかります）

## ステップ2: URL とキーを取得

プロジェクト作成後:

1. 左メニュー **Project Settings**（歯車アイコン）
2. **API** をクリック
3. 以下をコピー:
   - **Project URL**（例: `https://abcdefgh.supabase.co`）
   - **Project API keys** 内の **anon public**（`eyJ...` で始まる長い文字列）

## ステップ3: .env.local を更新

プロジェクトルートの `.env.local` を開き、以下を実際の値に置き換え:

```
NEXT_PUBLIC_SUPABASE_URL=ここに Project URL を貼り付け
NEXT_PUBLIC_SUPABASE_ANON_KEY=ここに anon public を貼り付け
```

## ステップ4: マイグレーションを実行

ターミナルで実行:

```bash
npm run supabase:link
# パスワードを聞かれたら、ステップ1で設定した Database Password を入力

npm run supabase:push
```

## ステップ5: 動作確認

1. `.env.local` で `AUTH_DISABLED=false` に設定（または該当行を削除）
2. Supabase ダッシュボード → **Authentication** → **Providers** → **Email** で、開発時は「Confirm email」をオフにするとメール確認なしでログインできます

```bash
npm run dev
```

http://localhost:3000 を開き、新規登録→ログイン→マイページが使えるか確認してください。
