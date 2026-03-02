# 募集・応募テーブル調査結果

リポジトリ内検索で特定した、募集詳細ページ実装に必要なスキーマ情報です。

---

## 1. 募集テーブル

| 項目 | 値 |
|------|-----|
| **テーブル名** | `recruitments` |
| **参照箇所** | `lib/db/recruitments-mvp.ts` (`.from("recruitments")`)、`supabase/migrations/00002_recruitments.sql` |

### 主要カラム
- `id` (UUID)
- `organizer_id`, `event_id`
- `title`, `description`
- `status` — 募集ステータス: `draft` | `public` | `closed` (migration 00018)
- `start_at`, `end_at` (TIMESTAMPTZ)
- `meeting_place`, `meeting_lat`, `meeting_lng`
- `roles` (JSONB) — `[{ name: string, count: number }]`
- `capacity` (INTEGER)
- `items_to_bring`, `provisions`, `notes`

---

## 2. 応募テーブル

| 項目 | 値 |
|------|-----|
| **テーブル名** | `recruitment_applications` |
| **参照箇所** | `lib/db/recruitments-mvp.ts` (`.from("recruitment_applications")`)、`supabase/migrations/00002_recruitments.sql`、`00018_volunteer_recruitment_mvp.sql` |

### 主要カラム
- `id` (UUID)
- `recruitment_id`, `user_id`
- **`status`** (TEXT) — 応募ステータス（下記）
- `message`, `checked_in_at`, `role_assigned`
- `created_at`

---

## 3. 応募ステータス（status カラム）

| カラム名 | `status` |
|---------|----------|
| **型** | TEXT |
| **制約** | `CHECK (status IN ('applied', 'confirmed', 'checked_in', 'completed', 'pending', 'accepted', 'rejected', 'canceled'))` (migration 00018) |

### ステータス値一覧（承認対応で使用するもの）

| DB値 | 表示名 | 用途 |
|------|--------|------|
| `pending` | 承認待ち | 新規応募・未対応 |
| `accepted` | 承認済み | 主催者が採用 |
| `confirmed` | 承認済み | 応募者の確定（採用と同等） |
| `rejected` | 却下 | 主催者が不採用 |
| `canceled` | キャンセル | 応募者キャンセル |
| `applied` | 申請中 | 旧値（pending に揃える推奨） |
| `checked_in` | チェックイン済 | 当日管理 |
| `completed` | 完了 | 当日終了後 |

---

## 4. 承認待ち/承認済み/却下の判定条件

### 承認待ち
```ts
a.status === "pending"
```
- `app/api/organizer/recruitments-dashboard/route.ts` L68-69: `if (a.status === "pending") appCountByRec[r].pending += 1`
- 新規応募は `insert({ status: "pending" })` で作成（`recruitments-mvp.ts` L258）

### 承認済み
```ts
a.status === "accepted" || a.status === "confirmed"
```
- `recruitments-dashboard/route.ts` L70: `if (a.status === "accepted" || a.status === "confirmed") appCountByRec[r].approved += 1`
- 定員トリガー（00018）も `accepted` / `confirmed` を採用としてカウント

### 却下
```ts
a.status === "rejected"
```

---

## 5. 更新ロジック（承認/却下）

**API**: `PATCH /api/recruitments/[id]/applications/[appId]`

**リクエスト body**:
```json
{ "status": "accepted" }   // 承認
{ "status": "rejected" }   // 却下
```

**許可される status 値**: `accepted`, `rejected`, `canceled`, `confirmed`, `pending`  
→ `app/api/recruitments/[id]/applications/[appId]/route.ts` L64-65, L110

**DB更新**: `lib/db/recruitments-mvp.ts` の `updateApplicationStatus()`  
→ `supabase.from("recruitment_applications").update({ status }).eq("id", applicationId)`

---

## 6. 型定義（参照元）

`lib/db/recruitments-mvp.ts`:
```ts
export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "canceled"
  | "applied"
  | "confirmed"
  | "checked_in"
  | "completed";
```

---

## まとめ（実装チェックリスト）

| 項目 | 確定値 |
|------|--------|
| 募集テーブル名 | `recruitments` |
| 応募テーブル名 | `recruitment_applications` |
| 応募ステータスカラム | `status` |
| 承認待ち | `status === "pending"` |
| 承認済み | `status === "accepted" \|\| status === "confirmed"` |
| 却下 | `status === "rejected"` |
| 承認API | `PATCH { status: "accepted" }` |
| 却下API | `PATCH { status: "rejected" }` |
