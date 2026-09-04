#!/usr/bin/env bash
# MachiGlyph の依存関係インストール（冪等）。
# Cloud Agent 環境のセットアップ (install フェーズ) で実行される。
set -euo pipefail

cd "$(dirname "$0")/.."

# 依存関係を lockfile どおりに再現インストール
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

chmod +x scripts/dev.sh scripts/sync-main.sh 2>/dev/null || true

# Cloud Agent 起動時は main を最新に揃える（未コミット変更がある場合は触らない）
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [[ "$(git branch --show-current 2>/dev/null || true)" == "main" ]] \
    && [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
    git fetch origin main >/dev/null 2>&1 || true
    if git rev-parse origin/main >/dev/null 2>&1 \
      && git merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
      git merge --ff-only origin/main >/dev/null 2>&1 || true
    fi
  fi
fi

# ローカル開発用の .env.local を用意（未作成時のみ）。
# Supabase 等の外部サービス未設定でもモックデータで開発サーバーが動くようにする。
if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
# Cloud Agent / ローカル開発用（自動生成）。Supabase 未設定でもモックデータで動作します。
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_DISABLED=true
NEXT_PUBLIC_AUTH_DISABLED=true
EOF
  echo "Created .env.local for local development."
fi
