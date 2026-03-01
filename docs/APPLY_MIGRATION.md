# マイグレーションの適用方法

`profiles` テーブルに基本情報カラム（phone, address, region, bio）を追加するマイグレーションを適用する方法です。

## 方法1: Supabase リンク + db push（推奨）

### 1. プロジェクトをリンク

`.env` または `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` が設定されている場合:

```bash
chmod +x scripts/supabase-link.sh
./scripts/supabase-link.sh
```

または手動で project ref を指定:

```bash
npx supabase link --project-ref <あなたのproject-ref>
```

**project ref の確認**: Supabase ダッシュボードの URL  
`https://supabase.com/dashboard/project/xxxx` の `xxxx` 部分、または  
`https://xxxx.supabase.co` の `xxxx` 部分

### 2. マイグレーションをプッシュ

```bash
npx supabase db push
```

## 方法2: SQL Editor で手動実行

1. [Supabase ダッシュボード](https://supabase.com/dashboard) を開く
2. プロジェクトを選択
3. 左メニュー **SQL Editor** を開く
4. 以下を貼り付けて実行:

```sql
-- profiles: 基本情報カラム追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;
```
