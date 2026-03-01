#!/bin/bash
# .env または .env.local から Supabase URL を読み取り、supabase link を実行します

set -e
cd "$(dirname "$0")/.."

# .env.local または .env から URL を取得
if [ -f .env.local ]; then
  source .env.local
elif [ -f .env ]; then
  source .env
else
  echo "エラー: .env または .env.local が見つかりません"
  echo "NEXT_PUBLIC_SUPABASE_URL を設定してから再実行してください"
  exit 1
fi

URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
if [ -z "$URL" ]; then
  echo "エラー: NEXT_PUBLIC_SUPABASE_URL が設定されていません"
  exit 1
fi

# https://xxxx.supabase.co から xxxx を抽出
REF=$(echo "$URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
if [ -z "$REF" ]; then
  echo "エラー: Supabase URL から project ref を取得できませんでした"
  echo "URL 形式: https://<project-ref>.supabase.co"
  exit 1
fi

echo "Project ref: $REF"
echo "リンクを実行します。データベースパスワードの入力を求められたら入力してください。"
npx supabase link --project-ref "$REF"
