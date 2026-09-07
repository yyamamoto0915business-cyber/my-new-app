# MachiGlyph レジ — iPhone カードタッチ

Visa などをスタッフの iPhone にかざすためのアプリです。Expo Go では動きません。実機の開発ビルドが必要です。

日本の Stripe Tap to Pay は Public preview です。Suica・iD・QUICPay は使えません。

## サーバー側（済み）

- Location: `tml_Gpv7SgumrrNB5K`（`.env.local` と Vercel の Production / Preview / Development）
- DB: `npm run pos:tap-migrate`（`pos_sales.payment_method` に `tap`）
- Webhook: `npm run pos:tap-webhook`（`payment_intent.succeeded` を本番 Webhook に追加済み）

レジのタッチ API を本番で使うには、未コミットのサーバー変更をデプロイする必要があります。

## Apple の利用許可（Account Holder が申請）

組織の Apple Developer アカウントの **Account Holder** でログインし、次のフォームから申請します。

https://developer.apple.com/contact/request/tap-to-pay-on-iphone/

記入の目安:

- Payment service provider（決済事業者）: **Stripe**
- Bundle ID: **`jp.machiglyph.pos`**
- 提供地域: **Japan**
- 用途: イベント会場のレジで、スタッフの iPhone にお客さんの Visa 等をかざして決済する

承認は開発用が先（目安 1〜2 営業日）、App Store / TestFlight 用は別途です。承認後、Identifiers の `jp.machiglyph.pos` に Tap to Pay on iPhone を付けます。アプリ側の entitlement は `app.json` に入れてあります。

## アプリをビルドする

この Mac にフルの Xcode は入っていません（Command Line Tools のみ）。実機へ直接焼くなら App Store から Xcode を入れてください。EAS のクラウドビルドなら Xcode は不要です。

```bash
cd apps/pos-tap
cp .env.example .env
# 本番向け: EXPO_PUBLIC_API_URL=https://www.machiglyph.jp
# 同じリポジトリの NEXT_PUBLIC_SUPABASE_* を入れる
npm install
```

ローカル実機（Xcode 導入後）:

```bash
npx expo prebuild --platform ios
npx expo run:ios --device
```

EAS（Apple 許可のあと）:

```bash
npx eas-cli login
npx eas build --platform ios --profile development
```

## 使い方

1. アプリで主催者アカウントにログインする
2. ウェブのレジで「カードタッチ」→ 会計する
3. 「iPhoneアプリを開く」でこのアプリに飛ぶ
4. カードを iPhone の上部にかざす
