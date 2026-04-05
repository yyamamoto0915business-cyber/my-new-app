# Supabase 認証の本番公開向け設定

本番ドメイン（例: https://www.machiglyph.jp）でログイン・新規登録・確認メールのリダイレクトを正しく動かすための設定です。

**メール確認は SSR フロー**で、リンクの受け口を `/auth/confirm` に統一し、`token_hash` をサーバー側で `verifyOtp()` してから完了画面へ遷移します。

---

## 1. Supabase Dashboard：URL Configuration

1. [Supabase Dashboard](https://supabase.com/dashboard) → 対象プロジェクトを開く
2. **Authentication** → **URL Configuration**

### Site URL

| 環境   | 推奨値                      |
|--------|-----------------------------|
| 本番   | `https://www.machiglyph.jp` |
| 開発   | `http://localhost:3000`     |

本番公開時は **Site URL を本番ドメインに設定**してください。

### Redirect URLs（許可リスト）

少なくとも以下を **Redirect URLs** に追加してください。

**本番**

- `https://www.machiglyph.jp/auth/confirm`
- `https://www.machiglyph.jp/auth/verified`
- `https://www.machiglyph.jp/auth/error`

**開発**

- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/auth/verified`
- `http://localhost:3000/auth/error`

パスワード再設定（**PKCE**）では、`resetPasswordForEmail` の `redirectTo` に  
`https://<サイトのオリジン>/auth/callback?flow=recovery` を渡しています（`lib/auth-redirect.ts`）。  
**Redirect URLs には少なくとも次のパスを含めてください**（クエリは Supabase が照合時に無視されることが多いですが、許可リストに **`/auth/callback`** 本体があることが重要です）。

- `https://www.machiglyph.jp/auth/callback`
- `http://localhost:3000/auth/callback`

**ルートドメイン**（`https://machiglyph.jp`）からもアクセスする場合は、`www` とは別に次も追加してください。

- `https://machiglyph.jp/auth/callback`

プレビュー環境がある場合は、必要に応じて同様のパスを追加してください。

**届かないときの確認**: Dashboard の **Authentication → Logs** で送信エラーを確認する。標準メールで届きにくい場合は [RESEND_SMTP_SETUP.md](./RESEND_SMTP_SETUP.md) の独自 SMTP を検討してください。

---

## 2. メールテンプレート（RedirectTo ベース）

**Authentication** → **Email Templates** を開きます。

### Confirm signup（日本語テンプレート推奨）

確認メールを日本語で分かりやすくする設定です。詳細とそのまま貼れる HTML は **[docs/EMAIL_CONFIRM_SIGNUP_JA.md](./EMAIL_CONFIRM_SIGNUP_JA.md)** を参照してください。

**件名（Supabase の Subject に設定）**

```
【MachiGlyph】メールアドレス確認のお願い
```

**確認リンク（Message body 内で使用）**

メール内の確認リンクは **RedirectTo ベース**にし、既存の `/auth/confirm` フローを使います。

```html
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

- **HTML 本文**: 上記リンクを使った日本語メールの全文 HTML は `docs/EMAIL_CONFIRM_SIGNUP_JA.md` にあります。Supabase の **Message body** にコピー＆ペーストして利用できます。
- `signUp` 時に `emailRedirectTo` に**オリジンのみ**（例: `https://www.machiglyph.jp`）を渡しているため、`{{ .RedirectTo }}` がその値になります。
- 本番では `NEXT_PUBLIC_SITE_URL` を本番ドメインにしておくことで、メール内リンクが必ず本番の `/auth/confirm` を指し、localhost や誤った host に飛びません。

### Magic Link（使う場合）

Magic Link テンプレートも同様にする場合の例です。

```html
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
```

---

## 3. アプリ側の実装概要

- **受け口**: メール内リンクはすべて **`/auth/confirm`** に飛ばす（上記テンプレートで指定）。
- **サーバー**: `app/auth/confirm/route.ts` の GET で `token_hash` と `type` をクエリから受け取り、`verifyOtp()` でセッションを確立。成功時は `/auth/verified`、失敗時は `/auth/error` にリダイレクト。
- **signUp**: `app/auth/actions.ts` のサーバーアクション `signUpWithEmail` で `emailRedirectTo` に **オリジンのみ**（`NEXT_PUBLIC_SITE_URL` または `http://localhost:3000`）を渡しています。
- **パスワード再設定**: `app/auth/reset-password/page.tsx` で `resetPasswordForEmail` の `redirectTo` に **`/auth/callback?flow=recovery`** を指定。コールバック後にパスワード更新画面へ進みます。

---

## 4. 環境変数

本番（Vercel など）で以下を設定してください。

- `NEXT_PUBLIC_SITE_URL=https://www.machiglyph.jp`  
  - signUp 時の `emailRedirectTo` とメール内の `{{ .RedirectTo }}` の元になります。
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
  - Supabase の本番プロジェクトの値

---

## 5. 本番運用での独自 SMTP（おすすめ）

Supabase 標準のメール送信では、送信元ドメインや到達率に制限があり、届かないことがあります。  
**確認メールを安定して届けたい場合は Resend の Custom SMTP を推奨**します。

→ 詳細は [docs/RESEND_SMTP_SETUP.md](./RESEND_SMTP_SETUP.md) を参照してください。

---

## チェックリスト（本番公開前）

- [ ] Site URL を `https://www.machiglyph.jp` に設定
- [ ] Redirect URLs に `/auth/confirm`・`/auth/verified`・`/auth/error` を追加
- [ ] Redirect URLs に `/auth/callback` を追加（`www` とルートドメインの両方を使うなら両方）
- [ ] Confirm signup の件名を「【MachiGlyph】メールアドレス確認のお願い」に、本文を [EMAIL_CONFIRM_SIGNUP_JA.md](./EMAIL_CONFIRM_SIGNUP_JA.md) の HTML に変更
- [ ] 本番環境変数に `NEXT_PUBLIC_SITE_URL` を設定（アクセスに使うオリジンと揃える。`www` 有無に注意）
- [ ] （任意）独自 SMTP の検討（再設定メールの到達率向上）
