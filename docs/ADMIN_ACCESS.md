# 開発者管理画面 入口と保護 実装まとめ

## 概要

`/admin` と `/api/admin/*` は **developer_admin** のみアクセス可能。
一般ユーザー・主催者には管理画面へのリンクを表示せず、URL直打ちでも入れない。

## 追加・更新したファイル

| ファイル | 役割 |
|---------|------|
| `proxy.ts` | `/admin`, `/api/admin` を保護。未ログイン→`/auth`、非admin→`/forbidden`。APIは401/403 JSON。Supabase proxy用クライアントを利用。 |
| `lib/supabase/proxy.ts` | **新規**。proxy.ts 用 Supabase クライアント（request/response の cookie コンテキスト）。 |
| `lib/auth/admin.ts` | `requireAdminPageAccess()`, `requireAdminApiAccess()` を追加。既存の `getCurrentUserProfile`, `isDeveloperAdmin`, `requireDeveloperAdmin` を維持。 |
| `app/admin/layout.tsx` | `requireAdminPageAccess()` で二重チェック。`getDeveloperAdminContext` を廃止し、`requireAdminPageAccess` に統一。 |
| `app/forbidden/page.tsx` | **新規**。権限なしアクセス時の表示ページ。 |
| `components/header/UserMenu.tsx` | 既存。developer_admin のときのみ「開発者管理画面」を表示。 |

## 認可の流れ（多層防御）

1. **proxy.ts**  
   - 未ログイン → `/auth?next=/admin` へリダイレクト  
   - ログイン済みだが developer_admin ではない → `/forbidden` へリダイレクト  
   - `/api/admin/*` は 401 / 403 JSON を返す  

2. **app/admin/layout.tsx**  
   - `requireAdminPageAccess()` で再チェック  
   - 未ログイン → `/auth?next=/admin` へリダイレクト  
   - 権限なし → `/forbidden` へリダイレクト  

3. **/api/admin/* Route Handlers**  
   - 各 Route Handler で `requireDeveloperAdmin()` を呼び出し  
   - 未認可は 401 / 403 JSON を返す  

## developer_admin の判定

- `profiles.role === 'developer_admin'` を最優先
- 補助として `ADMIN_EMAILS` / `DEV_ADMIN_EMAILS` / `ADMIN_IDS` / `DEV_ADMIN_IDS` で判定
- `lib/auth/admin.ts` の `isDeveloperAdmin(profile)` で共通化

## 環境変数

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（または `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`） |
| `ADMIN_EMAILS` | カンマ区切り。サーバー側のみ。`NEXT_PUBLIC_` は付けない |
| `DEV_ADMIN_EMAILS` | 開発環境用 |
| `ADMIN_IDS` / `DEV_ADMIN_IDS` | ユーザーIDで developer_admin とする場合 |

## アクセス結果の確認（4パターン）

| 状態 | `/admin` | `/api/admin/*` |
|------|----------|----------------|
| **未ログイン** | `/auth?next=/admin` へリダイレクト | 401 JSON `{ ok: false, error: { code: "UNAUTHORIZED", ... } }` |
| **一般ユーザー** | `/forbidden` へリダイレクト | 403 JSON `{ ok: false, error: { code: "FORBIDDEN", ... } }` |
| **organizer** | `/forbidden` へリダイレクト | 403 JSON |
| **developer_admin** | アクセス可能 | アクセス可能 |

## 入口（開発者だけが辿り着く導線）

- ヘッダー右上のプロフィールメニュー（`UserMenu`）に「開発者管理画面」を表示
- 表示は developer_admin のときのみ
- 一般ユーザー・主催者には表示しない
- クリックで `/admin` へ遷移
