# Supabase マイグレーション手順

プロジェクトを Supabase に接続している場合、以下のコマンドでマイグレーションを実行できます。

## 1. Supabase プロジェクトのリンク

```bash
npx supabase link
```

プロジェクトURLとサービスロールキーを入力してリンクします。

## 2. マイグレーションの適用

```bash
npx supabase db push
```

または、Supabase ダッシュボードの SQL Editor から、`supabase/migrations/` 内の各ファイルを順に実行してください。

## 適用するマイグレーション

- `00011_genres_reviews_gift_salon.sql` - ジャンル、レビュー、イベント拡張
- `00012_gift_codes_salon.sql` - ギフトコード、サロン会員
- `00013_featured_collections.sql` - 特集
- `00014_articles.sql` - 記事

※ 現在のアプリはインメモリストア（mock）で動作しており、マイグレーション未実行でも特集・記事・ギフト・サロンバッジは利用できます。
