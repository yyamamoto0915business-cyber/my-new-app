# メッセージ機能のセットアップ

## おすすめ・募集一覧のデータ表示

### イベント（おすすめ）

- `/api/events` の GET は Supabase の `events` テーブルを優先して取得します
- DB が空の場合は mock データ（日付を未来に調整済み）を表示
- 主催者がログインしてイベントを作成すると DB に保存され、おすすめに表示されます

### 募集（募集一覧）

- `/api/recruitments` は Supabase の `recruitments` テーブルから取得
- 募集が空の場合、以下でシードを投入可能:

```bash
npx tsx scripts/seed-recruitments-db.ts
```

※ 主催者（organizers）が1件以上存在する必要があります。主催者登録後、再実行してください。

---

## conversation_members エラー時

「conversation_members が見つからない」「スキーマキャッシュ」というエラーが出る場合、以下のいずれかを実施してください。

## 方法A: 直接DB接続（推奨・確実）

PostgREST のスキーマキャッシュを経由せず、直接データベースに接続します。

### 1. 接続文字列を取得

1. **Supabase ダッシュボード** を開く
2. 左メニュー **Project Settings**（歯車）→ **Database**
3. **Connection string** セクションで **URI** を選択
4. 表示された文字列の `[YOUR-PASSWORD]` を、プロジェクト作成時に設定した **Database Password** に置き換える

例: `postgresql://postgres.[プロジェクトID]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

### 2. .env.local に追加

```env
SUPABASE_DB_URL=上記で置き換えた接続文字列
```

### 3. 開発サーバーを再起動

```bash
# Ctrl+C で停止後
npm run dev
```

## 方法B: スキーマキャッシュのリロード

**Supabase ダッシュボード** → **SQL Editor** で以下を実行:

```sql
NOTIFY pgrst, 'reload schema';
```

うまくいかない場合、このコマンドも試してください:

```sql
SELECT pg_notification_queue_usage();
```

実行後、ブラウザを再読み込み。

## マイグレーションの確認

テーブルが存在するか確認する場合、SQL Editor で実行:

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'conversation_members'
);
```

`t` (true) が返ればテーブルは存在します。`f` の場合、以下でマイグレーションを適用してください:

```bash
npm run supabase:push
```
