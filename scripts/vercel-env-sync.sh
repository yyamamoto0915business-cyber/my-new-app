#!/bin/bash
# .env.local の環境変数を Vercel に反映
# 実行: ./scripts/vercel-env-sync.sh
# 前提: npx vercel link でプロジェクトをリンク済み、vercel login 済み

set -e
ENV_FILE="${1:-.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE が見つかりません"
  exit 1
fi

# 反映する変数（セキュリティのため明示的にリスト）
VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_DB_URL"
  "SUPABASE_DB_PASSWORD"
  "AUTH_SECRET"
  "AUTH_GOOGLE_ID"
  "AUTH_GOOGLE_SECRET"
  "AUTH_RESEND_KEY"
  "AUTH_RESEND_FROM"
  "NEXT_PUBLIC_AUTH_GOOGLE"
  "NEXT_PUBLIC_AUTH_RESEND"
  "AUTH_DISABLED"
  "NEXT_PUBLIC_AUTH_DISABLED"
  # Stripe（売上受取・主催者課金・協賛決済）。未設定だと本番で Connect が 503 になる
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  "STRIPE_PRICE_ORGANIZER_980"
  "STRIPE_PRICE_STARTER_980"
  "APP_URL"
)

echo "=== Vercel 環境変数 sync (Production) ==="
for key in "${VARS[@]}"; do
  val=$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//' | tr -d '\r')
  if [[ -n "$val" ]]; then
    echo -n "Adding $key... "
    if printf '%s' "$val" | npx vercel env add "$key" production 2>/dev/null; then
      echo "OK"
    else
      echo "skip (既に存在するかエラー。更新は Vercel ダッシュボードで)"
    fi
  fi
done
echo "Done. 再デプロイする場合: npx vercel --prod"
