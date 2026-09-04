#!/usr/bin/env bash
# 開発サーバー起動。main で作業ツリーがきれいなら origin/main を自動取り込み。
set -euo pipefail
cd "$(dirname "$0")/.."

try_sync_main() {
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    return 0
  fi

  local branch
  branch="$(git branch --show-current 2>/dev/null || true)"
  if [[ "$branch" != "main" ]]; then
    echo "[dev] ブランチ $branch のため自動同期をスキップします"
    return 0
  fi

  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    echo "[dev] 未保存の変更があるため自動同期をスキップします"
    return 0
  fi

  echo "[dev] origin/main を確認して取り込みます…"
  if ! git fetch origin main >/dev/null 2>&1; then
    echo "[dev] fetch に失敗したため、そのまま起動します"
    return 0
  fi

  local head remote
  head="$(git rev-parse HEAD)"
  remote="$(git rev-parse origin/main)"
  if [[ "$head" == "$remote" ]]; then
    echo "[dev] すでに最新です"
    return 0
  fi

  if git merge-base --is-ancestor HEAD origin/main; then
    git merge --ff-only origin/main
    echo "[dev] origin/main を取り込みました ($(git log -1 --oneline))"
  else
    echo "[dev] 履歴が分岐しているため自動同期できません。"
    echo "      揃える場合: ./scripts/sync-main.sh"
  fi
}

try_sync_main
exec npx next dev "$@"
