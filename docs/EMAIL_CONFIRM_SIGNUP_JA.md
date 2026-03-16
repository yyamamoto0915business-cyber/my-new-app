# 新規登録確認メール（日本語テンプレート）

Supabase の **Confirm signup** メールを日本語で分かりやすくするための設定です。

## 前提

- 認証は Supabase Auth、確認リンクの受け口は **`/auth/confirm`**（SSR）です。
- メール内のリンクは **`{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`** の形式にしてください（`{{ .ConfirmationURL }}` は使わず、既存フローに合わせます）。

---

## 1. 件名（Supabase に貼る）

```
【MachiGlyph】メールアドレス確認のお願い
```

---

## 2. 本文（プレーンテキストイメージ）

```
MachiGlyphへのご登録ありがとうございます。
アカウント作成を完了するため、下のボタンからメールアドレスの確認をお願いします。

[メールアドレスを確認する]

ボタンが開けない場合は、以下のURLをブラウザにコピーして開いてください。
（ここに確認URLが入ります）

このメールに心当たりがない場合は、対応不要です。

— MachiGlyph
```

---

## 3. HTML 本文（Supabase Email Templates に貼る）

Confirm signup の **Message body** に以下をそのまま貼り付けてください。  
スマホでも見やすいシンプルなデザインで、余白を取っています。  
確認リンクは既存の `/auth/confirm` フロー用に **`{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`** を使用しています。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>メールアドレス確認</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f2ee; font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f2ee;">
    <tr>
      <td style="padding: 32px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto; background-color:#ffffff; border-radius: 12px; border: 1px solid #e8e4df;">
          <tr>
            <td style="padding: 40px 28px;">
              <p style="margin:0 0 8px 0; font-size: 18px; font-weight: 600; color: #2c2926;">MachiGlyph</p>
              <p style="margin:0 0 24px 0; font-size: 12px; color: #6b6560;">まちの出来事に出会う</p>

              <p style="margin:0 0 20px 0; font-size: 15px; line-height: 1.7; color: #2c2926;">
                MachiGlyphへのご登録ありがとうございます。<br>
                アカウント作成を完了するため、下のボタンからメールアドレスの確認をお願いします。
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td style="border-radius: 10px; background-color: #a67c52;">
                    <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 500; color: #ffffff; text-decoration: none;">
                      メールアドレスを確認する
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #6b6560;">
                ボタンが開けない場合は、以下のURLをブラウザにコピーして開いてください。<br>
                <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" style="color: #a67c52; word-break: break-all;">{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email</a>
              </p>

              <p style="margin: 28px 0 0 0; font-size: 12px; line-height: 1.5; color: #8a837c;">
                このメールに心当たりがない場合は、対応不要です。
              </p>

              <p style="margin: 32px 0 0 0; font-size: 12px; color: #8a837c;">
                — MachiGlyph
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 補足

- **配色**: 背景 `#f5f2ee`（紙に近い色）、アクセント `#a67c52`（MachiGlyph のアクセントに近いトーン）、テキスト `#2c2926` / `#6b6560`（読みやすさ重視）。
- 本番では `NEXT_PUBLIC_SITE_URL=https://www.machiglyph.jp` により、`{{ .RedirectTo }}` が本番URLになり、確認後は `/auth/verified` へ遷移します。
