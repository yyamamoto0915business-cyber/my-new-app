"use client";

import { useState } from "react";

/** 参加コード：QR を読めない人が、アプリの「参加コードで参加」に入れて参加する。主催者は掲示や口頭で伝える。 */
export function GameJoinCodePanel({ gameId, published }: { gameId: string; published: boolean }) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function show() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/games/${gameId}/join-code`, { method: "POST" });
      const json = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !json.code) {
        setError(json.error ?? "参加コードを出せませんでした");
        return;
      }
      setCode(json.code);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="org-game-editor__panel">
      <h2>参加コード</h2>
      <p>
        QRを読めない人は、アプリの「参加コードで参加」（/play/code）にこのコードを入れると参加できます。会場の看板や口頭で伝えてください。
        {published ? "" : "（公開すると使えます）"}
      </p>
      {code ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap" }}>
          <b style={{ fontSize: "2rem", letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums", color: "#1a2214" }}>{code}</b>
          <button
            type="button"
            className="org-game-editor__reset"
            onClick={() => {
              void navigator.clipboard?.writeText(code).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
        </div>
      ) : (
        <button type="button" className="org-game-editor__reset" disabled={busy} onClick={() => void show()}>
          {busy ? "用意しています…" : "参加コードを表示する"}
        </button>
      )}
      {error ? <p className="org-game-editor__note">{error}</p> : null}
    </section>
  );
}
