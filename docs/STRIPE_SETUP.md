# MachiGlyph Stripe 決済 セットアップ

## 概要

- **応援機能**: 500円 / 1,000円 / 3,000円 の単発決済
- **有料イベント**: イベント参加費の決済（イベントごとに price または stripe_price_id を使用）
- **主催者プラン**: 月額980円のサブスクリプション
- **将来**: Stripe Connect による主催者分配に対応可能な設計

## 環境変数

```env
# 必須
STRIPE_SECRET_KEY=sk_live_...           # または sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...  # クライアント表示用（将来 Stripe Elements 使用時）
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook 署名検証

# 主催者サブスク用
STRIPE_PRICE_ORGANIZER_980=price_...    # 月980円 Price ID（または STRIPE_PRICE_STARTER_980）
```

## Stripe ダッシュボードでの準備

### 1. 主催者プラン（月額980円）

1. 製品 → 製品を追加 → 名前「MachiGlyph 主催者プラン」
2. 料金を追加 → 定額 → ¥980/月 → 保存
3. 作成された Price ID（`price_xxxxx`）を `STRIPE_PRICE_ORGANIZER_980` に設定

### 2. 応援・有料イベント

- 応援（500/1000/3000円）: `price_data` で動的生成のため、事前に Product/Price は不要
- 有料イベント: イベントの `price` カラムで `price_data` 生成。またはイベントに `stripe_price_id` を設定して固定 Price を使用

### 3. Webhook

1. Stripe ダッシュボード → 開発者 → Webhook
2. エンドポイント追加: `https://your-domain.com/api/stripe/webhook`
3. イベント選択:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`（任意）
   - `charge.refunded`（任意）
   - `account.updated`（Stripe Connect 使用時）
4. 署名シークレットを `STRIPE_WEBHOOK_SECRET` に設定

ローカル検証時は Stripe CLI を使用:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## API エンドポイント

| パス | 役割 |
|------|------|
| `POST /api/stripe/checkout/support` | 応援 Checkout Session 生成 |
| `POST /api/stripe/checkout/event` | 有料イベント Checkout Session 生成 |
| `POST /api/stripe/checkout/subscription` | 主催者サブスク Checkout Session 生成 |
| `POST /api/stripe/webhook` | Webhook 受信 |
| `POST /api/billing/checkout` | 主催者サブスク（課金ページ用・既存） |
| `POST /api/billing/portal` | Customer Portal（解約・カード変更） |

## 決済フロー

1. ユーザーがボタン押下 → API で Checkout Session 作成 → `session.url` にリダイレクト
2. Stripe Checkout で支払い
3. 成功時: `/payment/success` へリダイレクト
4. キャンセル時: イベント詳細 / 課金ページへリダイレクト（`cancel_url` で指定）
5. Webhook `checkout.session.completed` で DB 更新（正の情報源）

## DB テーブル

- `support_payments`: 応援決済
- `event_orders`: 有料イベント決済
- `organizer_subscriptions`: 主催者サブスク状態
- `event_participants`: 有料イベント決済成功時に `status=confirmed` で追加

## 将来の Stripe Connect 対応

- 主催者に売上を自動送金する場合は `transfer_data.destination` / `application_fee_amount` を使用
- 今回の実装は Connect を使わず、プラットフォーム口座への一括入金
