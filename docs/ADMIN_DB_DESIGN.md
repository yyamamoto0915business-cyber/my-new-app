# MachiGlyph 開発者管理画面・主催者プラン管理 DB 設計

## 概要

開発者専用の管理画面と主催者プラン管理を支える DB 設計です。
既存の `profiles` / `organizers` / `events` を壊さずに拡張し、Stripe 課金状態と MachiGlyph 内部の利用権限を分離して管理します。

## マイグレーション

- `supabase/migrations/00032_admin_plan_state_db.sql`

## 1. テーブル定義

### A. profiles 拡張

| カラム | 型 | 説明 |
|-------|-----|------|
| role | text NOT NULL DEFAULT 'user' | user \| organizer \| developer_admin |

制約: `role IN ('user', 'organizer', 'developer_admin')`

### B. organizer_plan_state（新規）

主催者のプラン状態を一元管理する中心テーブル。

| カラム | 型 | 説明 |
|-------|-----|------|
| id | uuid PK | |
| organizer_id | uuid UNIQUE FK(organizers) | |
| current_plan | text NOT NULL | free \| organizer |
| billing_source | text NOT NULL | free \| stripe \| manual \| campaign |
| stripe_customer_id | text | |
| stripe_subscription_id | text | |
| stripe_status | text | Stripe サブスク状態 |
| manual_grant_active | boolean NOT NULL | 手動付与有効 |
| manual_grant_plan | text | organizer（manual_grant_active 時のみ） |
| manual_grant_expires_at | timestamptz | 期限（null = 無期限） |
| grant_reason | text | 付与理由 |
| feature_overrides | jsonb | 将来の機能別解放用 |
| updated_by_admin | uuid FK(profiles) | |
| created_at / updated_at | timestamptz | |

### C. admin_logs 拡張

| 追加カラム | 型 | 説明 |
|-----------|-----|------|
| admin_email | text | 操作時のメール（補助） |
| metadata | jsonb | 補助情報 |

### D. organizer_notes（新規）

主催者への内部メモ。

| カラム | 型 | 説明 |
|-------|-----|------|
| id | uuid PK | |
| organizer_id | uuid FK(organizers) | |
| note | text NOT NULL | |
| created_by | uuid FK(profiles) | |
| created_at / updated_at | timestamptz | |

---

## 2. インデックス

- profiles: `role`, `email`
- organizer_plan_state: `organizer_id`(UNIQUE), `current_plan`, `billing_source`, `manual_grant_active`, `manual_grant_expires_at`
- admin_logs: `admin_user_id`, `target_organizer_id`, `action_type`, `created_at DESC`
- organizer_notes: `organizer_id`, `created_at DESC`

---

## 3. updated_at 自動更新

- profiles, organizer_plan_state, organizer_notes に `set_updated_at` トリガーを適用

---

## 4. 権限判定ロジック

主催者が有料機能を利用できるかは以下の優先順位で判定します。

1. `manual_grant_active = true` かつ `manual_grant_expires_at` が null または未来 → **手動付与** を優先
2. `manual_grant_active = true` でも `manual_grant_expires_at` が過去 → 手動付与は期限切れ扱い
3. 手動付与が無効なら `stripe_status` を参照（active / trialing / past_due かつ期間内なら有料扱い）
4. 上記いずれも該当しない場合は **free**

---

## 5. 関数 / RPC

| 関数 | 説明 |
|------|------|
| `is_developer_admin(user_id uuid)` | developer_admin かどうか |
| `grant_organizer_plan(organizer_id, grant_days, reason, admin_id)` | 30日/90日付与 |
| `grant_organizer_plan_unlimited(organizer_id, reason, admin_id)` | 無期限付与 |
| `revoke_manual_grant(organizer_id, reason, admin_id)` | 手動付与取り消し |
| `refresh_organizer_plan(organizer_id)` | current_plan 再計算 |
| `set_developer_admin_by_email(email)` | メールで developer_admin 設定（seed用） |

RPC 呼び出し例（Supabase client）:

```ts
const { error } = await supabase.rpc('grant_organizer_plan', {
  p_target_organizer_id: organizerId,
  p_grant_days: 30,
  p_reason: 'テスト用',
  p_admin_user_id: adminId,
});
```

---

## 6. RLS ポリシー

- **profiles**: 自分自身のみ参照・更新可。developer_admin は全件参照可
- **organizers**: 本人は自分の組織のみ。developer_admin は全件参照可
- **organizer_plan_state**: 本人は自分の組織のみ参照。developer_admin は全件参照・更新可
- **admin_logs**: developer_admin のみ参照・挿入可
- **organizer_notes**: developer_admin のみ参照・更新可

---

## 7. VIEW: admin_organizer_overview

`/admin/organizers` 一覧用のビュー。

```sql
SELECT * FROM admin_organizer_overview;
```

含まれる項目: organizer_id, display_name, email, role, current_plan, billing_source, manual_grant_active, manual_grant_expires_at, grant_reason, created_at, updated_at, event_count, published_event_count

---

## 8. 既存コードとの接続

### organizer_plan_state と organizers の同期

`organizer_plan_state` への INSERT/UPDATE 時に、`sync_organizer_plan_to_organizers` トリガーで `organizers` の `manual_grant_*`, `billing_source`, `updated_by_admin` が同期されます。既存の `resolveEffectivePlan(organizer)` はそのまま利用可能です。

### developer_admin 判定

- **サーバー側**: `lib/admin-auth.ts` の `isDeveloperAdminFromSupabaseUser` が env の `DEV_ADMIN_EMAILS` / `DEV_ADMIN_IDS` と `profiles.role = 'developer_admin'` の両方を考慮
- **DB 側**: `is_developer_admin(user_id)` は `profiles.role` のみで判定

本番では `profiles.role` を正しく更新することが重要です。

### developer_admin の初期設定

Supabase ダッシュボードの SQL Editor で実行:

```sql
SELECT set_developer_admin_by_email('your-admin@example.com');
```

開発時は `.env.local` に `DEV_ADMIN_EMAILS=your@example.com` を設定すれば、profiles の role がなくても env ベースで admin アクセス可能です。

---

## 9. データ移行

既存の `organizers` にある `manual_grant_*`, `billing_source`, `stripe_*` を元に、マイグレーション時に `organizer_plan_state` へ移行しています。移行後は `organizer_plan_state` が主な状態管理テーブルとなり、organizers はトリガーで同期されます。
