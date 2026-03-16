# Resend で Custom SMTP を設定する（確認メール届くようにする）

Supabase 標準のメールは届きにくいことがあるため、Resend の Custom SMTP を使うことで確認メールを安定して届けられます。

---

## 1. Resend アカウント作成

1. [Resend](https://resend.com) にアクセス
2. サインアップ（無料）
3. ログインしてダッシュボードへ

---

## 2. API キーを取得

1. Resend ダッシュボード → [API Keys](https://resend.com/api-keys)
2. **Create API Key** をクリック
3. 名前（例: `Supabase Auth`）を入力
4. **Add** で作成し、表示された API キー（`re_` で始まる）をコピー  
   ※このときだけ表示されるので、安全な場所に控えておく

---

## 3. Supabase で Custom SMTP を設定

### 開発・テスト用（ドメイン認証なし）

ドメイン認証をまだしていない場合は、Resend のテスト用アドレスが使えます。

1. [Supabase Dashboard](https://supabase.com/dashboard) → 対象プロジェクト
2. **Project Settings**（左下の歯車）→ **Auth**
3. 下へスクロールして **SMTP Settings** を探す
4. **Enable Custom SMTP** を ON
5. 次を入力：

| 項目 | 値 |
|------|-----|
| **Sender email** | `onboarding@resend.dev` |
| **Sender name** | `MachiGlyph`（任意） |
| **Host** | `smtp.resend.com` |
| **Port** | `465` |
| **Username** | `resend` |
| **Password** | （Resend の API キー `re_xxxxx` を貼り付け） |

6. **Save** をクリック

> **注意**: `onboarding@resend.dev` はテスト用のため、到達率に制限がある場合があります。本番では 4 のドメイン認証を推奨します。

---

## 4. 本番用（ドメイン認証あり）

本番ドメイン（例: `www.machiglyph.jp`）から送る場合は、Resend でドメインを認証します。

### 4.1 Resend でドメイン追加

1. Resend ダッシュボード → [Domains](https://resend.com/domains)
2. **Add Domain** をクリック
3. ドメインを入力（例: `machiglyph.jp` または `www.machiglyph.jp`）
4. Resend が表示する **DNS レコード**（SPF, DKIM など）を、ドメインの DNS 管理画面に追加
5. 認証完了まで数分〜数十分待つ（通常 5〜10 分）

### 4.2 Supabase の Sender を変更

- **Sender email** を認証済みドメインのアドレスに変更（例: `noreply@machiglyph.jp`）
- その他の設定（Host, Port, Username, Password）は同じ

---

## 5. 動作確認

1. アプリの新規登録画面で、新しいメールアドレスで登録
2. 1〜2 分以内に確認メールが届くか確認
3. 届かない場合は迷惑メールフォルダも確認

Resend ダッシュボードの [Emails](https://resend.com/emails) で送信ログも確認できます。

---

## トラブルシューティング

- **メールが届かない**: 迷惑メールフォルダを確認。Resend の Emails で「Delivered」になっているか確認
- **認証エラー**: API キーが正しくコピーされているか、先頭・末尾の余分なスペースがないか確認
- **ドメイン認証が通らない**: DNS の反映に最大 48 時間かかることがあります。SPF/DKIM の値を正確にコピーしているか確認

---

## 参考リンク

- [Resend - Send with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)
- [Supabase - Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
