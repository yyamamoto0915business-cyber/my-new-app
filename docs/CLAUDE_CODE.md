# Claude Code（CLI）

このリポジトリでターミナルから [Claude Code](https://code.claude.com/docs/en/overview.md) を使うときのメモです。

## 前提

- **Claude Pro / Max / Teams / Enterprise**、または **Claude Console（API）** など、公式が認めた契約があれば Claude Code を利用できます。有料プランで利用している場合は、この前提を満たしています。
- 参考: **無料の Claude.ai のみ**の場合は Claude Code は使えません（[Advanced setup](https://code.claude.com/docs/en/setup.md)）。チームに共有するときの注意として記載しています。
- 料金・プランの詳細は [Claude の料金ページ](https://claude.com/pricing) および [Console](https://console.anthropic.com/) を参照してください。

## インストール確認

```bash
claude --version
```

詳細チェックは対話可能なターミナルで `claude doctor`（[公式](https://code.claude.com/docs/en/setup.md#verify-your-installation)）。

## 初回ログイン（認証）

1. プロジェクトのディレクトリでターミナルを開く。
2. `claude` を実行する。
3. 案内に従い **ブラウザでログイン**（開かない場合は表示に従い URL をコピー）。
4. セッション内から切り替える場合は **`/login`**（[Quickstart](https://code.claude.com/docs/en/quickstart.md)）。

ログアウトは **`/logout`**。資格情報の扱いは [Authentication](https://code.claude.com/docs/en/authentication.md) を参照。

## API キーで使う場合

Claude Console の API キーを使う場合は **`ANTHROPIC_API_KEY`** など、公式の [Authentication](https://code.claude.com/docs/en/authentication.md) に従って設定します。サブスクの OAuth とキーが両方ある場合の優先順位も同ページにあります。

## このプロジェクトで使い始める

```bash
cd ~/dev/my-new-app   # このリポジトリをクローンしたパスに合わせる
claude
```

初めての対話の例は [Quickstart](https://code.claude.com/docs/en/quickstart.md) を参照。

## 公式ドキュメント

- [Quickstart](https://code.claude.com/docs/en/quickstart.md)
- [Advanced setup（インストール・更新・アンインストール）](https://code.claude.com/docs/en/setup.md)
- [Authentication](https://code.claude.com/docs/en/authentication.md)
- [CLI reference](https://code.claude.com/docs/en/cli-reference.md)

## Cursor との関係

**Claude Code のログイン**と **Cursor 内の AI（Models）**は別です。ターミナルで `claude` にログインしても、Cursor のチャット／Agent の認証が自動で切り替わるわけではありません。
