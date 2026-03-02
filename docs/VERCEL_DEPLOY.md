# Vercel デプロイ手順

## 環境変数の同期

`.env.local` の内容を Vercel に反映する場合:

```bash
./scripts/vercel-env-sync.sh
```

反映する変数: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_DB_PASSWORD`, `AUTH_*` など

**前提**: `npx vercel link` でプロジェクトをリンク済み

## 本番デプロイ

```bash
npx vercel --prod
```

または、GitHub に push すると自動デプロイされます。

## メッセージ機能に必要な環境変数

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_DB_URL` | DB 接続文字列（Transaction Pooler） |
| `SUPABASE_DB_PASSWORD` | DB パスワード |

`SUPABASE_DB_URL` にパスワードを埋め込む代わりに、`SUPABASE_DB_PASSWORD` を別変数で指定します（`@` 等のエンコード問題を回避）。
