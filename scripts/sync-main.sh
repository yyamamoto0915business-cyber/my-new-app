#!/usr/bin/env bash
# 手元を GitHub の main に揃えて開発サーバーを起動する
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 既存の next dev を停止"
pkill -f "next dev" 2>/dev/null || true
sleep 1

echo "==> origin/main を取得"
git fetch origin main

echo "==> 未保存の変更があれば退避"
git stash push -u -m "auto-stash before sync-main $(date +%Y%m%d-%H%M%S)" 2>/dev/null || true

echo "==> origin/main に同期"
git checkout main
git reset --hard origin/main

echo "==> 現在のコミット"
git log -1 --oneline

if [[ ! -f app/organizer/pos/page.tsx ]]; then
  echo "ERROR: レジ画面のファイルがありません。同期に失敗している可能性があります。"
  exit 1
fi

echo "==> npm run dev を起動"
npm run dev
