#!/bin/bash
# Supabase 導入の初期セットアップ
# .env.local がなければ .env.example からコピーします

set -e
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  echo ".env.local は既に存在します。編集して Supabase の URL とキーを設定してください。"
  exit 0
fi

if [ ! -f .env.example ]; then
  echo "エラー: .env.example が見つかりません"
  exit 1
fi

cp .env.example .env.local
echo ".env.local を作成しました。"
echo ""
echo "次のステップ:"
echo "1. Supabase ダッシュボード (Project Settings → API) で URL と anon key を取得"
echo "2. .env.local の NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定"
echo "3. ./scripts/supabase-link.sh でリンク"
echo "4. npx supabase db push でマイグレーション適用"
echo ""
echo "詳しくは docs/SUPABASE_SETUP.md を参照してください。"
