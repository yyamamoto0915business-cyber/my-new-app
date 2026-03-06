# Vercel ドメイン DNS 設定手順（お名前.com）

`www.machiglyph.jp` でサイトを表示するための DNS 設定です。

---

## 1. お名前.com で DNS レコード設定に移動

1. [お名前.com](https://www.onamae.com) にログイン
2. 左メニュー **「DNS ネームサーバー」** をクリック
3. **「DNS設定/転送設定 ドメイン一覧」** を開く
4. `machiglyph.jp` の行で **「ドメインDNS」** をクリック
5. **「DNSレコード設定」** を選択

---

## 2. 登録するレコード（2つ）

### レコード 1: ルートドメイン（machiglyph.jp）

| 項目 | 入力値 |
|------|--------|
| **ホスト名** | `@` |
| **TYPE** | `A` |
| **TTL** | `3600` |
| **VALUE** | `216.198.79.1` |
| **状態** | `有効` |

※Vercel の Domains 画面に表示される IP をそのまま使用してください。

---

### レコード 2: www サブドメイン（www.machiglyph.jp）【必須】

| 項目 | 入力値 |
|------|--------|
| **ホスト名** | `www` |
| **TYPE** | `CNAME` |
| **TTL** | `3600` |
| **VALUE** | `d04630f4f9a03aa7.vercel-dns-017.com.` |
| **状態** | `有効` |

※Vercel の Domains 画面で `www.machiglyph.jp` をクリックしたときに出る CNAME の値を使ってください。プロジェクトごとに異なります。

---

## 3. コピペ用テキスト

### A レコード（ルート）

```
ホスト名: @
TYPE: A
TTL: 3600
VALUE: 216.198.79.1
```

### CNAME レコード（www）← これがないと www で開きません

```
ホスト名: www
TYPE: CNAME
TTL: 3600
VALUE: d04630f4f9a03aa7.vercel-dns-017.com.
```

※末尾の `.` はオプションです。お名前.com でエラーになる場合は `.` を外して `d04630f4f9a03aa7.vercel-dns-017.com` を試してください。

---

## 4. 確認事項

- **www** の CNAME を入れていないと `https://www.machiglyph.jp` は開きません（お名前.com のデフォルトページになります）
- A レコードはルート（@）用、CNAME は www 用と分けて設定してください
- DNS の反映には最大 24〜48 時間かかる場合があります（多くの場合は数分〜数時間）
- 反映後、Vercel の Domains で `machiglyph.jp` と `www.machiglyph.jp` が「Valid Configuration」になるか確認してください

---

## 5. Invalid Configuration のままの場合の確認

Vercel で「Invalid Configuration」が消えないときは以下を確認してください。

| 項目 | ルート (machiglyph.jp) | www (www.machiglyph.jp) |
|------|------------------------|-------------------------|
| レコード | A | CNAME |
| ホスト名 | `@` | `www` |
| 値 | `216.198.79.1` | `d04630f4f9a03aa7.vercel-dns-017.com.` |

- **お名前.com のネームサーバー**が「お名前.com の DNS」になっているか確認
- 同じホスト名の**重複レコード**がないか確認（古いレコードを削除）
- 設定後 **5〜30 分** 待ってから Vercel を再確認（DNS 反映に時間がかかることがあります）

---

## 6. Vercel で表示される値の確認方法

1. Vercel ダッシュボード → プロジェクト選択
2. **Settings** → **Domains**
3. `machiglyph.jp` または `www.machiglyph.jp` をクリック
4. 表示される A / CNAME の値を、お名前.com の設定と照合
