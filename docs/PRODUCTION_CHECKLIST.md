# 運用フェーズ移行チェックリスト

MachiGlyph を本番運用する前に確認・設定する項目です。

## 1. 環境変数（Vercel）

Vercel ダッシュボード: **Project** → **Settings** → **Environment Variables**

### 必須

| 変数 | 説明 | 確認 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | ☐ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ☐ |
| `AUTH_DISABLED` | **本番では必ず `false`** | ☐ |
| `NEXT_PUBLIC_AUTH_DISABLED` | **本番では必ず `false`** | ☐ |
| `AUTH_SECRET` | `openssl rand -base64 32` で生成 | ☐ |

### メッセージ機能を使う場合

| 変数 | 説明 | 確認 |
|------|------|------|
| `SUPABASE_DB_URL` | Transaction Pooler の接続文字列 | ☐ |
| `SUPABASE_DB_PASSWORD` | DB パスワード | ☐ |

### オプション

| 変数 | 説明 |
|------|------|
| `STRIPE_SECRET_KEY` | スポンサー決済（未設定時は即時 paid 扱い） |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google ログイン |
| `AUTH_RESEND_KEY` / `AUTH_RESEND_FROM` | メール認証 |

**一括同期:** `.env.local` から同期する場合 → `./scripts/vercel-env-sync.sh`

---

## 2. Supabase 本番設定

Supabase ダッシュボード → **Authentication** → **URL Configuration**

| 設定 | 値 | 確認 |
|------|-----|------|
| **Site URL** | `https://your-app.vercel.app`（本番 URL） | ☐ |
| **Redirect URLs** | `https://your-app.vercel.app/**` を追加 | ☐ |

※ カスタムドメインを使う場合は、その URL を設定

---

## 3. マイグレーション

本番 Supabase プロジェクトにスキーマを適用します。

```bash
npx supabase db push
```

または SQL Editor で `supabase/migrations/` 内の SQL を 00001 から順に実行。

---

## 4. 運用前の動作確認

- [ ] 本番 URL でトップページが表示される
- [ ] サインアップ → メール確認 → ログインができる
- [ ] イベント一覧・詳細が表示される
- [ ] 主催者登録・イベント作成ができる
- [ ] メッセージ機能を使う場合、DM が送受信できる

---

## 5. 運用開始後

- **監視**: Vercel の Deployments でビルド状況を確認
- **バックアップ**: Supabase 有料プランで Point-in-Time Recovery
- **ドメイン**: カスタムドメインは Vercel → Domains で設定
