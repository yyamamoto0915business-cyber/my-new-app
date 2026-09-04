#!/usr/bin/env bash
# ローカル Supabase スタックを起動し、.env.local を接続情報で更新する（任意・オンデマンド）。
#
# 目的:
#   モックデータではなく「実データベース」でアプリを動かしたいときに使う。
#   Docker が未導入でも自動セットアップする（Cloud Agent / ネスト化コンテナ環境対応）。
#
# 使い方:
#   bash scripts/local-supabase.sh          # 起動 & .env.local 更新
#   bash scripts/local-supabase.sh --stop   # 停止
#
# 注意:
#   - このスクリプトは開発サーバーの常時起動には焼き込んでいない（毎回の起動が重くなるため）。
#   - 生成する .env.local はローカル既定キーを使う。本番では絶対に使わないこと。
set -euo pipefail

cd "$(dirname "$0")/.."

SUPABASE="npx --no-install supabase"

if [ "${1:-}" = "--stop" ]; then
  $SUPABASE stop || true
  echo "Local Supabase stopped."
  exit 0
fi

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "==> Installing Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
  fi

  # ネスト化コンテナ環境向けの設定:
  #   - overlayfs はマウントできないことがあるため fuse-overlayfs を使う
  #   - Docker のブリッジ NAT が nftables では機能しないことがあるため legacy iptables に切替
  if ! command -v fuse-overlayfs >/dev/null 2>&1; then
    sudo apt-get update -y || true
    sudo apt-get install -y fuse-overlayfs
  fi
  if [ ! -f /etc/docker/daemon.json ] || ! grep -q "fuse-overlayfs" /etc/docker/daemon.json 2>/dev/null; then
    echo '{ "storage-driver": "fuse-overlayfs" }' | sudo tee /etc/docker/daemon.json >/dev/null
  fi
  if update-alternatives --list iptables >/dev/null 2>&1; then
    sudo update-alternatives --set iptables /usr/sbin/iptables-legacy || true
    sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy || true
  fi

  echo "==> Starting Docker daemon..."
  sudo service docker restart || sudo service docker start || true
  # ソケットを sudo 無しで使えるようにする
  sudo chmod 666 /var/run/docker.sock || true

  # デーモンの準備待ち
  for _ in $(seq 1 30); do
    if docker info >/dev/null 2>&1; then break; fi
    sleep 1
  done
  docker info >/dev/null 2>&1 || { echo "Docker daemon did not become ready" >&2; exit 1; }
}

ensure_config() {
  if [ ! -f supabase/config.toml ]; then
    echo "==> Initializing Supabase project config..."
    printf 'N\n' | $SUPABASE init
  fi
  # Realtime はネスト化環境で起動時マイグレーションが不安定なため無効化（アプリのコア機能には不要）
  if grep -qE '^\[realtime\]' supabase/config.toml; then
    perl -0pi -e 's/(\[realtime\]\s*\nenabled\s*=\s*)true/${1}false/' supabase/config.toml || true
  fi
}

write_env_local() {
  echo "==> Writing .env.local with local Supabase connection..."
  local api_url anon_key service_key
  api_url=$($SUPABASE status -o json | sed -n 's/.*"API_URL": *"\([^"]*\)".*/\1/p')
  anon_key=$($SUPABASE status -o json | sed -n 's/.*"ANON_KEY": *"\([^"]*\)".*/\1/p')
  service_key=$($SUPABASE status -o json | sed -n 's/.*"SERVICE_ROLE_KEY": *"\([^"]*\)".*/\1/p')

  cat > .env.local <<EOF
# 自動生成 (scripts/local-supabase.sh) — ローカル Supabase 接続。本番では使用しないこと。
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=${api_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon_key}
SUPABASE_SERVICE_ROLE_KEY=${service_key}
AUTH_DISABLED=false
NEXT_PUBLIC_AUTH_DISABLED=false
AUTH_SECRET=local-dev-secret-please-change
EOF
}

ensure_docker
ensure_config
echo "==> Starting local Supabase stack (this may pull Docker images on first run)..."
$SUPABASE start
write_env_local

echo
echo "Local Supabase is running. Migrations in supabase/migrations were applied automatically."
echo "Restart the dev server to pick up .env.local:  npm run dev:network"
echo "Supabase Studio: http://localhost:54323"
