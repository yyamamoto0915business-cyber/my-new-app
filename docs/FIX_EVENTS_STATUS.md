# events.status カラムエラーの修正手順

## 症状
- `/api/events` の GET で `column events.status does not exist` エラー
- Vercel Function のログに PostgreSQL エラーコード 42703

## 原因
本番 Supabase の `events` テーブルに `status` カラムが存在しない（マイグレーション 00028 が未適用）

## 解決方法

### 方法1: Supabase Dashboard で SQL を実行（推奨）

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. 本番プロジェクトを選択
3. 左メニュー **SQL Editor** をクリック
4. 以下の SQL を貼り付けて **Run** をクリック

```sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsor_enabled BOOLEAN NOT NULL DEFAULT true;
```

⚠️ `draft` の一括 `published` 更新は、未公開イベントまで公開してしまう可能性があります。  
既存イベントを全件公開してよい運用の場合のみ、以下を手動実行してください。

```sql
UPDATE public.events
SET status = 'published', published_at = COALESCE(published_at, created_at)
WHERE status = 'draft';
```

### 方法2: Supabase CLI で push

DB パスワードで接続できる場合:

```bash
npm run supabase:link   # 未リンクの場合
npm run supabase:push   # 全マイグレーションを適用
```

※ 認証エラーが出る場合は、Supabase Dashboard → Project Settings → Database でパスワードを確認し、`supabase link` をやり直してください。

## 確認
- `/api/events` にアクセスしてイベント一覧が返ることを確認
- イベント一覧ページ（/events）が正常に表示されることを確認
